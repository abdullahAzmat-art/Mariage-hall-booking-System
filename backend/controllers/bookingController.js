const Booking = require('../models/bookingModel');
const Hall = require('../models/hallModel');
const { createCommissionPayment } = require('./commissionController');

const {
  BOOKING_STATUSES,
  BookingError,
  assertStatusTransition,
  calculateBookingAmounts,
  getCommissionPercentage,
  getPrebookingPercentage,
  normalizeCustomFood,
  normalizeTransactionId,
  readString,
} = require('../services/bookingRules');
const {
  applyCancellation,
  assertCanCancel,
  createBookingForUser,
  paymentDeadline,
  verifyBookingAvailability,
} = require('../services/bookingService');
const {
  expireStaleBookings,
  getHallAvailability,
} = require('../services/availabilityService');

const sendError = (res, error, fallback = 'Something went wrong. Please try again.') => {
  if (error && Number.isInteger(error.status)) {
    return res.status(error.status).json({
      message: error.message,
      ...(error.code ? { code: error.code } : {}),
    });
  }
  if (error && error.name === 'ValidationError') {
    return res.status(400).json({ message: error.message });
  }
  if (error && error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid identifier' });
  }

  console.error('Booking error:', error);
  return res.status(500).json({ message: fallback });
};

const assertManagerCanManage = (booking, user) => {
  if (user.role === 'admin') return;

  const managerId = booking.hallId?.manager;
  if (!managerId || managerId.toString() !== user.id) {
    throw new BookingError('Not authorized to manage this booking', 403, 'forbidden');
  }
};

const recalculateForFood = (booking, hall, foodPerHead) => {
  const hallPrice = Number(booking.hallPrice ?? hall.price) || 0;
  const packagePrice = Number(booking.packagePrice) || 0;

  return calculateBookingAmounts({
    hallPrice,
    foodPerHead,
    guestsCount: booking.guestsCount,
    packagePrice,
  });
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private/Customer
const createBooking = async (req, res) => {
  try {
    const booking = await createBookingForUser({
      customerId: req.user.id,
      payload: req.body,
    });
    res.status(201).json(booking);
  } catch (error) {
    sendError(res, error, 'Could not create booking');
  }
};

// @desc    Get all bookings (Admin/Manager)
// @route   GET /api/bookings
// @access  Private/Admin/Manager
const getBookings = async (req, res) => {
  try {
    await expireStaleBookings();

    const filter = { archived: { $ne: true } };

    // Managers may only list bookings for halls they own.
    if (req.user.role !== 'admin') {
      const halls = await Hall.find({ manager: req.user.id }).select('_id');
      filter.hallId = { $in: halls.map((hall) => hall._id) };
    }

    const bookings = await Booking.find(filter)
      .populate('customerId', 'name email')
      .populate('hallId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    sendError(res, error, 'Could not load bookings');
  }
};

// @desc    Get my bookings (Customer)
// @route   GET /api/bookings/my
// @access  Private/Customer
const getMyBookings = async (req, res) => {
  try {
    await expireStaleBookings();

    const bookings = await Booking.find({
      customerId: req.user.id,
      archived: { $ne: true },
    })
      .populate('hallId', 'name manager')
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    sendError(res, error, 'Could not load your bookings');
  }
};

// @desc    Get hall booking slots (public, no customer data)
// @route   GET /api/bookings/hall/:hallId
// @access  Public
const getHallBookings = async (req, res) => {
  try {
    const availability = await getHallAvailability(req.params.hallId);
    res.status(200).json(
      availability.bookings.map((booking) => ({
        eventDate: booking.eventDateKey,
        eventDateKey: booking.eventDateKey,
        timeSlot: booking.timeSlot,
        status: booking.status,
      }))
    );
  } catch (error) {
    sendError(res, error, 'Could not load hall availability');
  }
};

// @desc    Get hall availability (manager blocks + active bookings)
// @route   GET /api/bookings/hall/:hallId/availability
// @access  Public
const getHallAvailabilityStatus = async (req, res) => {
  try {
    const availability = await getHallAvailability(req.params.hallId);
    res.status(200).json(availability);
  } catch (error) {
    sendError(res, error, 'Could not load hall availability');
  }
};

// @desc    Get manager bookings
// @route   GET /api/bookings/manager
// @access  Private/Manager
const getManagerBookings = async (req, res) => {
  try {
    await expireStaleBookings();

    const halls = await Hall.find({ manager: req.user.id }).select('_id');
    const hallIds = halls.map((hall) => hall._id);

    const bookings = await Booking.find({
      hallId: { $in: hallIds },
      archived: { $ne: true },
    })
      .populate('customerId', 'name email')
      .populate('hallId', 'name manager')
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    sendError(res, error, 'Could not load manager bookings');
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private/Admin/Manager
const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('hallId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    assertManagerCanManage(booking, req.user);

    const { status, reason } = req.body;
    if (!BOOKING_STATUSES.includes(status)) {
      throw new BookingError('Invalid booking status');
    }
    if (status === 'approved' || status === 'payment_submitted') {
      throw new BookingError(
        'This status is set by the payment workflow, not the general status endpoint'
      );
    }

    if (booking.status === status) {
      return res.status(200).json(booking);
    }

    assertStatusTransition(booking.status, status);

    const now = new Date();
    const update = { status };

    if (status === 'completed') {
      update.completedAt = now;
      update.commissionAmount = Math.round(booking.totalAmount * getCommissionPercentage());
    }
    if (status === 'cancelled') {
      update.cancelledAt = now;
      update.cancellationReason = typeof reason === 'string' ? reason.trim().slice(0, 500) : '';
      update.paymentStatus = booking.paymentStatus === 'verified' ? 'verified' : 'cancelled';
    }
    if (status === 'rejected') {
      update.rejectedAt = now;
      update.cancellationReason = typeof reason === 'string' ? reason.trim().slice(0, 500) : '';
    }
    if (status === 'expired') {
      update.expiredAt = now;
      update.paymentStatus = 'expired';
    }

    // Conditional update prevents two managers from applying conflicting
    // transitions to the same booking at the same time.
    const updatedBooking = await Booking.findOneAndUpdate(
      { _id: booking._id, status: booking.status },
      update,
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      throw new BookingError(
        'Booking status changed by another request. Refresh and try again.',
        409,
        'status_conflict'
      );
    }

    if (status === 'completed') {
      const hall = await Hall.findById(updatedBooking.hallId);
      if (hall && hall.manager) {
        await createCommissionPayment(
          updatedBooking._id,
          hall.manager,
          updatedBooking.commissionAmount
        );
      } else {
        console.error('Hall or manager not found for commission payment');
      }
    }

    res.status(200).json(updatedBooking);
  } catch (error) {
    sendError(res, error, 'Could not update booking status');
  }
};

// @desc    Archive a booking (history is preserved, records are not deleted)
// @route   DELETE /api/bookings/:id
// @access  Private/Admin/Manager
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('hallId', 'manager');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    assertManagerCanManage(booking, req.user);

    if (booking.archived) {
      return res.status(200).json({ message: 'Booking is already archived' });
    }

    const now = new Date();
    const update = { archived: true };

    // Release the slot for non-terminal bookings without destroying history.
    if (!['rejected', 'cancelled', 'expired', 'completed'].includes(booking.status)) {
      update.status = 'cancelled';
      update.cancelledAt = now;
      update.cancellationReason = 'Archived by management';
      if (booking.paymentStatus !== 'verified') {
        update.paymentStatus = 'cancelled';
      }
    }

    const archived = await Booking.findByIdAndUpdate(req.params.id, update, { new: true });

    res.status(200).json({
      message: 'Booking archived. Booking and payment history has been preserved.',
      booking: archived,
    });
  } catch (error) {
    sendError(res, error, 'Could not archive booking');
  }
};

// @desc    Submit payment proof
// @route   PUT /api/bookings/:id/payment-proof
// @access  Private/Customer
const submitPaymentProof = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.customerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    if (!['awaiting_payment', 'payment_rejected'].includes(booking.status)) {
      throw new BookingError(
        'Payment proof cannot be submitted for this booking in its current status'
      );
    }

    if (booking.paymentExpiresAt && booking.paymentExpiresAt.getTime() <= Date.now()) {
      booking.status = 'expired';
      booking.paymentStatus = 'expired';
      booking.expiredAt = new Date();
      await booking.save();
      throw new BookingError(
        'The payment window has expired. Please create a new booking.',
        400,
        'payment_expired'
      );
    }

    if (booking.customFoodStatus === 'pending') {
      throw new BookingError(
        'Please wait for the hall manager to review your custom food request before paying'
      );
    }

    if (!req.file || !req.file.path) {
      throw new BookingError('A payment proof image is required');
    }

    const transactionId = normalizeTransactionId(req.body.transactionId);

    const duplicate = await Booking.findOne({
      transactionId,
      _id: { $ne: booking._id },
    }).select('_id');

    if (duplicate) {
      throw new BookingError(
        'This transaction ID has already been used for another booking',
        409,
        'duplicate_transaction'
      );
    }

    booking.transactionId = transactionId;
    booking.paymentProof = req.file.path;
    booking.status = 'payment_submitted';
    booking.paymentStatus = 'submitted';
    booking.paymentSubmittedAt = new Date();
    booking.paymentVerified = false;
    booking.prebookingPaid = false;
    booking.paymentRejectionReason = '';
    booking.verifiedBy = undefined;
    booking.verificationDate = undefined;

    const updatedBooking = await booking.save();
    res.status(200).json(updatedBooking);
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({
        message: 'This transaction ID has already been used for another booking',
        code: 'duplicate_transaction',
      });
    }
    sendError(res, error, 'Could not submit payment proof');
  }
};

// @desc    Verify payment and approve the booking
// @route   PUT /api/bookings/:id/verify-payment
// @access  Private/Manager/Admin
const verifyPayment = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('hallId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    assertManagerCanManage(booking, req.user);

    if (booking.status !== 'payment_submitted') {
      throw new BookingError('No payment proof is awaiting verification for this booking');
    }
    if (!booking.paymentProof || !booking.transactionId) {
      throw new BookingError('Payment proof and transaction ID are required before approval');
    }
    if (booking.customFoodStatus === 'pending') {
      throw new BookingError('Review the pending custom food request before approving payment');
    }

    // Availability is re-checked because the manager may have blocked the date,
    // or the slot may have been released and re-booked since the request.
    await verifyBookingAvailability(booking);

    const now = new Date();
    const updatedBooking = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'payment_submitted' },
      {
        $set: {
          paymentVerified: true,
          prebookingPaid: true,
          verifiedBy: req.user.id,
          verificationDate: now,
          status: 'approved',
          paymentStatus: 'verified',
          paymentRejectionReason: '',
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      throw new BookingError(
        'Booking status changed by another request. Refresh and try again.',
        409,
        'status_conflict'
      );
    }

    res.status(200).json(updatedBooking);
  } catch (error) {
    sendError(res, error, 'Could not verify payment');
  }
};

// @desc    Reject payment
// @route   PUT /api/bookings/:id/reject-payment
// @access  Private/Manager/Admin
const rejectPayment = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('hallId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    assertManagerCanManage(booking, req.user);

    if (booking.status !== 'payment_submitted') {
      throw new BookingError('No payment proof is awaiting verification for this booking');
    }

    const reason = readString(req.body.reason, 'reason', { max: 500 });

    const updatedBooking = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'payment_submitted' },
      {
        $set: {
          paymentVerified: false,
          prebookingPaid: false,
          paymentStatus: 'rejected',
          paymentRejectionReason: reason,
          status: 'payment_rejected',
          // Give the customer a fresh window to submit a corrected proof.
          paymentExpiresAt: paymentDeadline(),
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      throw new BookingError(
        'Booking status changed by another request. Refresh and try again.',
        409,
        'status_conflict'
      );
    }

    res.status(200).json(updatedBooking);
  } catch (error) {
    sendError(res, error, 'Could not reject payment');
  }
};

// @desc    Replace custom food request (before payment)
// @route   POST /api/bookings/:id/custom-food
// @access  Private/Customer
const addCustomFood = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('hallId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.customerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    if (booking.status !== 'awaiting_payment') {
      throw new BookingError('Custom food can only be changed before payment is submitted');
    }

    const hall = await Hall.findById(booking.hallId._id);
    if (!hall) {
      throw new BookingError('Hall not found', 404, 'hall_not_found');
    }

    const { items, foodPerHead } = normalizeCustomFood(req.body.customFood, hall.menu || []);
    const amounts = recalculateForFood(booking, hall, foodPerHead);

    booking.customFood = items;
    booking.customFoodStatus = items.length > 0 ? 'pending' : 'none';
    booking.foodPerHead = foodPerHead;
    booking.customSeatPrice = amounts.seatPrice;
    booking.totalAmount = amounts.totalAmount;
    booking.prebookingAmount = amounts.prebookingAmount;
    booking.prebookingPercentage = getPrebookingPercentage();

    const updatedBooking = await booking.save();
    res.status(200).json(updatedBooking);
  } catch (error) {
    sendError(res, error, 'Could not update custom food');
  }
};

// @desc    Approve or reject custom food
// @route   PATCH /api/bookings/:id/custom-food-status
// @access  Private/Manager/Admin
const updateCustomFoodStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      throw new BookingError('Invalid custom food status');
    }

    const booking = await Booking.findById(req.params.id).populate('hallId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    assertManagerCanManage(booking, req.user);

    if (booking.customFoodStatus !== 'pending') {
      throw new BookingError('There is no pending custom food request for this booking');
    }
    if (['payment_submitted', 'approved', 'completed'].includes(booking.status)) {
      throw new BookingError('Custom food cannot be changed after payment is submitted');
    }

    const hall = await Hall.findById(booking.hallId._id);
    if (!hall) {
      throw new BookingError('Hall not found', 404, 'hall_not_found');
    }

    // Stored prices were validated against the menu when the request was made.
    const requestedFoodPerHead = (booking.customFood || []).reduce(
      (total, item) => total + Number(item.price) * Number(item.quantity),
      0
    );
    const chargedFoodPerHead = status === 'approved' ? requestedFoodPerHead : 0;
    const amounts = recalculateForFood(booking, hall, chargedFoodPerHead);

    // Absolute recalculation (never "add the difference") prevents duplicate
    // charges if this endpoint is retried.
    booking.customFoodStatus = status;
    booking.foodPerHead = chargedFoodPerHead;
    booking.customSeatPrice = amounts.seatPrice;
    booking.totalAmount = amounts.totalAmount;
    booking.prebookingAmount = amounts.prebookingAmount;
    booking.prebookingPercentage = getPrebookingPercentage();

    const updatedBooking = await booking.save();
    res.status(200).json(updatedBooking);
  } catch (error) {
    sendError(res, error, 'Could not update custom food status');
  }
};

// @desc    Cancel own booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private/Customer
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.customerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    assertCanCancel(booking);

    applyCancellation(booking, { reason: req.body.reason });

    const updatedBooking = await booking.save();
    res.status(200).json(updatedBooking);
  } catch (error) {
    sendError(res, error, 'Could not cancel booking');
  }
};

// @desc    Reject a booking request (manager/admin)
// @route   PUT /api/bookings/:id/reject
// @access  Private/Manager/Admin
const rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('hallId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    assertManagerCanManage(booking, req.user);

    if (!['awaiting_payment', 'payment_submitted', 'payment_rejected'].includes(booking.status)) {
      throw new BookingError('This booking cannot be rejected in its current status');
    }

    assertStatusTransition(booking.status, 'rejected');

    const now = new Date();
    const reason = readString(req.body.reason, 'reason', {
      max: 500,
      required: false,
    }) || 'Rejected by hall management';

    const updatedBooking = await Booking.findOneAndUpdate(
      { _id: booking._id, status: booking.status },
      {
        $set: {
          status: 'rejected',
          rejectedAt: now,
          cancellationReason: reason,
          ...(booking.paymentStatus === 'submitted' ? { paymentStatus: 'rejected' } : {}),
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      throw new BookingError(
        'Booking status changed by another request. Refresh and try again.',
        409,
        'status_conflict'
      );
    }

    res.status(200).json(updatedBooking);
  } catch (error) {
    sendError(res, error, 'Could not reject booking');
  }
};

module.exports = {
  createBooking,
  getBookings,
  getMyBookings,
  updateBookingStatus,
  deleteBooking,
  submitPaymentProof,
  verifyPayment,
  rejectPayment,
  addCustomFood,
  updateCustomFoodStatus,
  getManagerBookings,
  getHallBookings,
  getHallAvailabilityStatus,
  cancelBooking,
  rejectBooking,
};
