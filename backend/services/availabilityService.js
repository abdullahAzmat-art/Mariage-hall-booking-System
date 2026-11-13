const Booking = require('../models/bookingModel');
const Hall = require('../models/hallModel');

const {
  BLOCKING_BOOKING_STATUSES,
  BookingError,
  getPrebookingPercentage,
  normalizeTimeSlot,
} = require('./bookingRules');
const {
  assertDateKey,
  dateKeyToUtcDate,
  getBusinessTimeZone,
  getBusinessDateKey,
  isPastDateKey,
  toDateKey,
} = require('../utils/dateKey');

const SLOT_REASON_MESSAGES = {
  past_date: 'The selected event date is in the past',
  blocked_by_manager: 'The hall manager has blocked this date',
  slot_taken: 'The hall is already booked for this date and time slot',
  invalid_date: 'The selected event date is invalid',
};

// Pure decision function so availability rules can be tested without a database.
const evaluateSlotAvailability = ({
  hall,
  bookings = [],
  eventDateKey,
  timeSlot,
  excludeBookingId = null,
}) => {
  const slot = normalizeTimeSlot(timeSlot);

  const managerBlockedDates = new Set(
    (hall?.bookedDates || []).map((date) => toDateKey(date)).filter(Boolean)
  );

  if (managerBlockedDates.has(eventDateKey)) {
    return {
      available: false,
      reason: 'blocked_by_manager',
      message: SLOT_REASON_MESSAGES.blocked_by_manager,
    };
  }

  const conflict = (Array.isArray(bookings) ? bookings : []).find((booking) => {
    if (!booking || !BLOCKING_BOOKING_STATUSES.includes(booking.status)) return false;
    if (excludeBookingId && String(booking._id) === String(excludeBookingId)) return false;

    const bookingDateKey = booking.eventDateKey || toDateKey(booking.eventDate);
    return bookingDateKey === eventDateKey && booking.timeSlot === slot;
  });

  if (conflict) {
    return {
      available: false,
      reason: 'slot_taken',
      message: SLOT_REASON_MESSAGES.slot_taken,
      conflictBookingId: String(conflict._id),
    };
  }

  return { available: true, reason: null, message: null };
};

// Expired payment windows release the slot. This is called before availability
// checks so a stale "awaiting_payment" booking cannot block a new customer.
const expireStaleBookings = async ({ hallId = null, eventDateKey = null } = {}) => {
  const query = {
    status: { $in: ['awaiting_payment', 'payment_rejected'] },
    paymentExpiresAt: { $ne: null, $lte: new Date() },
  };

  if (hallId) query.hallId = hallId;
  if (eventDateKey) query.eventDateKey = eventDateKey;

  const result = await Booking.updateMany(query, {
    $set: {
      status: 'expired',
      paymentStatus: 'expired',
      expiredAt: new Date(),
    },
  });

  return result.modifiedCount || 0;
};

const buildDateQuery = (hallId, eventDateKey) => ({
  hallId,
  status: { $in: BLOCKING_BOOKING_STATUSES },
  // eventDateKey covers new bookings; eventDate covers legacy rows written
  // before date keys were stored.
  $or: [
    { eventDateKey },
    { eventDate: dateKeyToUtcDate(eventDateKey) },
  ],
});

const findActiveBookingsForDate = async (hallId, eventDateKey) =>
  Booking.find(buildDateQuery(hallId, eventDateKey))
    .select('eventDate eventDateKey timeSlot status')
    .lean();

const checkHallAvailability = async ({
  hallId,
  eventDate,
  timeSlot,
  excludeBookingId = null,
}) => {
  const eventDateKey = toDateKey(eventDate);
  if (!eventDateKey) {
    return {
      available: false,
      reason: 'invalid_date',
      message: SLOT_REASON_MESSAGES.invalid_date,
    };
  }
  assertDateKey(eventDateKey, 'eventDate');

  const slot = normalizeTimeSlot(timeSlot);

  const hall = await Hall.findById(hallId);
  if (!hall) throw new BookingError('Hall not found', 404, 'hall_not_found');

  if (isPastDateKey(eventDateKey)) {
    return {
      available: false,
      reason: 'past_date',
      message: SLOT_REASON_MESSAGES.past_date,
    };
  }

  await expireStaleBookings({ hallId, eventDateKey });

  const bookings = await findActiveBookingsForDate(hallId, eventDateKey);

  return evaluateSlotAvailability({
    hall,
    bookings,
    eventDateKey,
    timeSlot: slot,
    excludeBookingId,
  });
};

const assertHallAvailable = async (options) => {
  const result = await checkHallAvailability(options);
  if (!result.available) {
    throw new BookingError(result.message, 409, result.reason);
  }
  return result;
};

// Public availability payload used by the hall details page. Only blocking
// bookings are exposed, and only as date keys + time slots (no customer data).
const getHallAvailability = async (hallId, { now = new Date() } = {}) => {
  const hall = await Hall.findById(hallId);
  if (!hall) throw new BookingError('Hall not found', 404, 'hall_not_found');

  await expireStaleBookings({ hallId });

  const bookings = await Booking.find({
    hallId,
    status: { $in: BLOCKING_BOOKING_STATUSES },
  })
    .select('eventDate eventDateKey timeSlot status')
    .lean();

  const blockedDates = [
    ...new Set((hall.bookedDates || []).map((date) => toDateKey(date)).filter(Boolean)),
  ].sort();

  return {
    hallId: String(hall._id),
    businessTimezone: getBusinessTimeZone(),
    businessToday: getBusinessDateKey(now),
    prebookingPercentage: getPrebookingPercentage(),
    blockedDates,
    bookings: bookings
      .map((booking) => ({
        bookingId: String(booking._id),
        eventDateKey: booking.eventDateKey || toDateKey(booking.eventDate),
        timeSlot: booking.timeSlot,
        status: booking.status,
      }))
      .filter((booking) => Boolean(booking.eventDateKey)),
  };
};

module.exports = {
  SLOT_REASON_MESSAGES,
  evaluateSlotAvailability,
  expireStaleBookings,
  findActiveBookingsForDate,
  checkHallAvailability,
  assertHallAvailable,
  getHallAvailability,
};
