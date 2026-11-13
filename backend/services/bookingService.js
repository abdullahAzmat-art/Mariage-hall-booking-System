const mongoose = require('mongoose');
const Booking = require('../models/bookingModel');
const Hall = require('../models/hallModel');
const Package = require('../models/packageModel');

const {
  BookingError,
  assertStatusTransition,
  calculateBookingAmounts,
  getCancellationWindowDays,
  getPaymentWindowHours,
  getPrebookingPercentage,
  normalizeCnic,
  normalizeCustomFood,
  normalizeEventType,
  normalizeGuestsCount,
  normalizePhone,
  normalizeTimeSlot,
} = require('./bookingRules');
const {
  evaluateSlotAvailability,
  expireStaleBookings,
  findActiveBookingsForDate,
  checkHallAvailability,
} = require('./availabilityService');
const {
  assertDateKey,
  daysBetweenDateKeys,
  dateKeyToUtcDate,
  getBusinessDateKey,
  isPastDateKey,
  toDateKey,
} = require('../utils/dateKey');

const paymentDeadline = (from = Date.now()) =>
  new Date(from + getPaymentWindowHours() * 60 * 60 * 1000);

const duplicateSlotError = () =>
  new BookingError(
    'This date and time slot has just been booked. Please choose another slot.',
    409,
    'slot_taken'
  );

const isDuplicateKeyError = (error) => error && error.code === 11000;

const readObjectId = (value, field) => {
  if (!value || !mongoose.isValidObjectId(value)) {
    throw new BookingError(`${field} is invalid`);
  }
  return value;
};

const resolvePackage = async (payload, hallId) => {
  if (payload.packageId === undefined || payload.packageId === null || payload.packageId === '') {
    return { packageId: null, packagePrice: 0 };
  }

  const packageId = readObjectId(payload.packageId, 'packageId');
  const pkg = await Package.findOne({ _id: packageId, hallId });

  if (!pkg) {
    throw new BookingError('Selected package does not belong to this hall');
  }

  const packagePrice = Number(pkg.price);
  if (!Number.isFinite(packagePrice) || packagePrice < 0) {
    throw new BookingError('Selected package has an invalid price');
  }

  return { packageId: pkg._id, packagePrice };
};

const readBookingRequest = (payload, hall) => {
  if (!payload || typeof payload !== 'object') {
    throw new BookingError('Booking details are required');
  }

  const eventDateKey = toDateKey(payload.eventDate);
  if (!eventDateKey) {
    throw new BookingError('eventDate must be a valid date in YYYY-MM-DD format');
  }
  assertDateKey(eventDateKey, 'eventDate');

  if (isPastDateKey(eventDateKey)) {
    throw new BookingError('eventDate cannot be in the past');
  }

  const eventType = normalizeEventType(payload.eventType);
  const timeSlot = normalizeTimeSlot(payload.timeSlot);
  const phone = normalizePhone(payload.phone);
  const cnic = normalizeCnic(payload.cnic);
  const guestsCount = normalizeGuestsCount(payload.guestsCount, hall.capacity);
  const { items: customFood, foodPerHead } = normalizeCustomFood(payload.customFood, hall.menu);

  return {
    eventDateKey,
    eventType,
    timeSlot,
    phone,
    cnic,
    guestsCount,
    customFood,
    foodPerHead,
  };
};

const ensureSlotIsFree = async ({ hall, eventDateKey, timeSlot }) => {
  await expireStaleBookings({ hallId: hall._id, eventDateKey });

  const bookings = await findActiveBookingsForDate(hall._id, eventDateKey);
  const result = evaluateSlotAvailability({
    hall,
    bookings,
    eventDateKey,
    timeSlot,
  });

  if (!result.available) {
    throw new BookingError(result.message, 409, result.reason);
  }
};

// Single trusted entry point for both the REST API and the AI booking graph.
// The client supplies identity, selected menu item names and quantities only.
// Every price and every total is calculated here from saved hall/package data.
const createBookingForUser = async ({ customerId, payload }) => {
  if (!customerId || !mongoose.isValidObjectId(customerId)) {
    throw new BookingError('A signed-in customer is required', 401, 'unauthenticated');
  }

  if (!payload || typeof payload !== 'object') {
    throw new BookingError('Booking details are required');
  }

  const hallId = readObjectId(payload.hallId, 'hallId');
  const hall = await Hall.findById(hallId);
  if (!hall) {
    throw new BookingError('Hall not found', 404, 'hall_not_found');
  }

  const request = readBookingRequest(payload, hall);
  const { packageId, packagePrice } = await resolvePackage(payload, hall._id);

  const hallPrice = Number(hall.price);
  if (!Number.isFinite(hallPrice) || hallPrice < 0) {
    throw new BookingError('Hall price is invalid');
  }

  const amounts = calculateBookingAmounts({
    hallPrice,
    foodPerHead: request.foodPerHead,
    guestsCount: request.guestsCount,
    packagePrice,
  });

  await ensureSlotIsFree({
    hall,
    eventDateKey: request.eventDateKey,
    timeSlot: request.timeSlot,
  });

  try {
    return await Booking.create({
      customerId,
      hallId: hall._id,
      eventDate: dateKeyToUtcDate(request.eventDateKey),
      eventDateKey: request.eventDateKey,
      eventType: request.eventType,
      timeSlot: request.timeSlot,
      phone: request.phone,
      cnic: request.cnic,
      guestsCount: request.guestsCount,
      hallPrice,
      foodPerHead: request.foodPerHead,
      customSeatPrice: amounts.seatPrice,
      customFood: request.customFood,
      customFoodStatus: request.customFood.length > 0 ? 'pending' : 'none',
      packageId,
      packagePrice,
      totalAmount: amounts.totalAmount,
      prebookingAmount: amounts.prebookingAmount,
      prebookingPercentage: getPrebookingPercentage(),
      status: 'awaiting_payment',
      paymentStatus: 'unpaid',
      paymentExpiresAt: paymentDeadline(),
      paymentMethod: 'cash',
    });
  } catch (error) {
    // The unique (hallId, eventDate, timeSlot) index is the final guard for
    // two customers submitting the same slot at the same moment.
    if (isDuplicateKeyError(error)) throw duplicateSlotError();
    throw error;
  }
};

// Used before approving a payment: the slot may have been blocked by the
// manager or otherwise become unavailable after the original request.
const verifyBookingAvailability = async (booking) => {
  const hallId = booking.hallId?._id || booking.hallId;
  const eventDateKey = booking.eventDateKey || toDateKey(booking.eventDate);

  const result = await checkHallAvailability({
    hallId,
    eventDate: eventDateKey,
    timeSlot: booking.timeSlot,
    excludeBookingId: booking._id,
  });

  if (!result.available) {
    throw new BookingError(`Cannot approve this booking: ${result.message}`, 409, result.reason);
  }
};

const assertCanCancel = (booking, now = new Date()) => {
  if (!['awaiting_payment', 'payment_rejected', 'approved'].includes(booking.status)) {
    throw new BookingError('This booking cannot be cancelled in its current status');
  }

  if (booking.status !== 'approved') return;

  const eventDateKey = booking.eventDateKey || toDateKey(booking.eventDate);
  const daysUntilEvent = daysBetweenDateKeys(getBusinessDateKey(now), eventDateKey);

  if (daysUntilEvent < getCancellationWindowDays()) {
    throw new BookingError(
      `Approved bookings can only be cancelled at least ${getCancellationWindowDays()} days before the event`
    );
  }
};

const applyCancellation = (booking, { reason, now = new Date() } = {}) => {
  assertStatusTransition(booking.status, 'cancelled');
  booking.status = 'cancelled';
  booking.paymentStatus = booking.paymentStatus === 'verified' ? 'verified' : 'cancelled';
  booking.cancelledAt = now;
  booking.cancellationReason = typeof reason === 'string' ? reason.trim().slice(0, 500) : '';
  return booking;
};

module.exports = {
  paymentDeadline,
  duplicateSlotError,
  readBookingRequest,
  ensureSlotIsFree,
  createBookingForUser,
  verifyBookingAvailability,
  assertCanCancel,
  applyCancellation,
};
