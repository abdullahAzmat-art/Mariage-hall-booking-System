const DEFAULT_PREBOOKING_PERCENTAGE = 0.1;
const DEFAULT_COMMISSION_PERCENTAGE = 0.05;
const DEFAULT_PAYMENT_WINDOW_HOURS = 48;
const DEFAULT_CANCELLATION_WINDOW_DAYS = 7;

// Statuses that still hold the date/time slot. Rejected, cancelled and expired
// bookings release the slot and are ignored by availability checks.
const BLOCKING_BOOKING_STATUSES = [
  'awaiting_payment',
  'payment_submitted',
  'payment_rejected',
  'approved',
  'completed',
];

const BOOKING_STATUSES = [
  ...BLOCKING_BOOKING_STATUSES,
  'rejected',
  'cancelled',
  'expired',
];

const PAYMENT_STATUSES = [
  'unpaid',
  'submitted',
  'verified',
  'rejected',
  'cancelled',
  'expired',
];

const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening'];
const EVENT_TYPES = ['Wedding', 'Reception', 'Engagement', 'Birthday', 'Corporate', 'Other'];

const EVENT_TYPE_ALIASES = {
  'corporate event': 'Corporate',
  nikah: 'Wedding',
  walima: 'Reception',
  mehndi: 'Wedding',
  engagement: 'Engagement',
};

const ALLOWED_TRANSITIONS = {
  awaiting_payment: ['payment_submitted', 'rejected', 'cancelled', 'expired'],
  payment_submitted: ['approved', 'payment_rejected', 'rejected', 'cancelled'],
  payment_rejected: ['payment_submitted', 'rejected', 'cancelled', 'expired'],
  approved: ['completed', 'cancelled'],
  rejected: [],
  cancelled: [],
  completed: [],
  expired: [],
};

class BookingError extends Error {
  constructor(message, status = 400, code = null) {
    super(message);
    this.name = 'BookingError';
    this.status = status;
    this.code = code;
  }
}

const readEnvNumber = (name, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const value = Number(process.env[name]);
  if (!Number.isFinite(value) || value < min || value > max) return fallback;
  return value;
};

const getPrebookingPercentage = () =>
  readEnvNumber('PREBOOKING_PERCENTAGE', DEFAULT_PREBOOKING_PERCENTAGE, { min: 0.01, max: 1 });

const getCommissionPercentage = () =>
  readEnvNumber('COMMISSION_PERCENTAGE', DEFAULT_COMMISSION_PERCENTAGE, { min: 0, max: 1 });

const getPaymentWindowHours = () =>
  readEnvNumber('PAYMENT_WINDOW_HOURS', DEFAULT_PAYMENT_WINDOW_HOURS, { min: 1, max: 720 });

const getCancellationWindowDays = () =>
  readEnvNumber('CANCELLATION_WINDOW_DAYS', DEFAULT_CANCELLATION_WINDOW_DAYS, { min: 0, max: 90 });

const readString = (value, field, { max = 200, required = true } = {}) => {
  if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
    if (required) throw new BookingError(`${field} is required`);
    return '';
  }
  if (typeof value !== 'string') throw new BookingError(`${field} must be text`);

  const trimmed = value.trim();
  if (trimmed.length > max) throw new BookingError(`${field} is too long`);
  return trimmed;
};

const readInteger = (value, field, { min, max }) => {
  if (value === undefined || value === null || value === '') {
    throw new BookingError(`${field} is required`);
  }

  const number = Number(value);
  if (!Number.isFinite(number) || !Number.isInteger(number)) {
    throw new BookingError(`${field} must be a whole number`);
  }
  if (number < min || number > max) {
    throw new BookingError(`${field} must be between ${min} and ${max}`);
  }
  return number;
};

const normalizeTimeSlot = (value, { required = true } = {}) => {
  if (value === undefined || value === null || value === '') {
    if (!required) return null;
    throw new BookingError('timeSlot is required');
  }
  if (typeof value !== 'string') throw new BookingError('timeSlot is invalid');

  const match = TIME_SLOTS.find((slot) => slot.toLowerCase() === value.trim().toLowerCase());
  if (!match) {
    throw new BookingError(`timeSlot must be one of: ${TIME_SLOTS.join(', ')}`);
  }
  return match;
};

const normalizeEventType = (value) => {
  if (value === undefined || value === null || value === '') return 'Wedding';
  if (typeof value !== 'string') throw new BookingError('eventType is invalid');

  const trimmed = value.trim();
  if (trimmed.length > 50) throw new BookingError('eventType is too long');

  const alias = EVENT_TYPE_ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;

  const match = EVENT_TYPES.find((type) => type.toLowerCase() === trimmed.toLowerCase());
  if (!match) {
    throw new BookingError(`eventType must be one of: ${EVENT_TYPES.join(', ')}`);
  }
  return match;
};

const normalizePhone = (value) => {
  const phone = readString(value, 'phone', { max: 30 });
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) {
    throw new BookingError('phone must contain between 7 and 15 digits');
  }
  return phone;
};

const normalizeCnic = (value) => {
  const cnic = readString(value, 'cnic', { max: 30 });
  const digits = cnic.replace(/\D/g, '');
  if (digits.length !== 13) {
    throw new BookingError('cnic must contain exactly 13 digits (e.g. 12345-1234567-1)');
  }
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
};

const normalizeGuestsCount = (value, capacity) => {
  const guests = readInteger(value, 'guestsCount', { min: 1, max: 100000 });

  if (Number.isFinite(Number(capacity)) && guests > Number(capacity)) {
    throw new BookingError(`Guest count cannot exceed hall capacity of ${capacity}`);
  }
  return guests;
};

const normalizeTransactionId = (value) => {
  const transactionId = readString(value, 'transactionId', { max: 64 });
  if (transactionId.length < 4) {
    throw new BookingError('transactionId must be at least 4 characters');
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9 ._-]*$/.test(transactionId)) {
    throw new BookingError('transactionId may only contain letters, numbers, spaces, dots, dashes and underscores');
  }
  return transactionId;
};

// Only menu item names and per-head quantities are trusted from the client.
// Prices always come from the hall's saved menu.
const normalizeCustomFood = (value, menu = []) => {
  if (value === undefined || value === null) return { items: [], foodPerHead: 0 };
  if (!Array.isArray(value)) throw new BookingError('customFood must be a list');
  if (value.length > 50) throw new BookingError('Too many custom food items');

  const menuByName = new Map(
    (Array.isArray(menu) ? menu : [])
      .filter((item) => item && typeof item.name === 'string')
      .map((item) => [item.name.trim().toLowerCase(), item])
  );

  const seen = new Set();
  const items = [];

  value.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new BookingError(`customFood[${index}] is invalid`);
    }

    const rawName = entry.itemName ?? entry.name;
    const name = readString(rawName, `customFood[${index}].itemName`, { max: 200 });
    const key = name.toLowerCase();

    if (seen.has(key)) {
      throw new BookingError(`customFood contains duplicate item: ${name}`);
    }
    seen.add(key);

    const menuItem = menuByName.get(key);
    if (!menuItem) {
      throw new BookingError(`${name} is not available on this hall's menu`);
    }

    const price = Number(menuItem.price);
    if (!Number.isFinite(price) || price < 0) {
      throw new BookingError(`${name} has an invalid menu price`);
    }

    const quantity = readInteger(entry.quantity ?? 1, `customFood[${index}].quantity`, {
      min: 1,
      max: 20,
    });

    items.push({
      itemName: menuItem.name,
      price,
      quantity,
    });
  });

  const foodPerHead = items.reduce((total, item) => total + item.price * item.quantity, 0);

  return { items, foodPerHead };
};

const calculateBookingAmounts = ({ hallPrice, foodPerHead = 0, guestsCount, packagePrice = 0 }) => {
  const basePrice = Number(hallPrice);
  const foodPrice = Number(foodPerHead);
  const addOnPrice = Number(packagePrice);
  const guests = Number(guestsCount);

  if (!Number.isFinite(basePrice) || basePrice < 0) {
    throw new BookingError('Hall price is invalid');
  }
  if (!Number.isFinite(foodPrice) || foodPrice < 0) {
    throw new BookingError('Food price is invalid');
  }
  if (!Number.isFinite(addOnPrice) || addOnPrice < 0) {
    throw new BookingError('Package price is invalid');
  }
  if (!Number.isFinite(guests) || !Number.isInteger(guests) || guests < 1) {
    throw new BookingError('guestsCount is invalid');
  }

  const seatPrice = Math.round((basePrice + foodPrice) * 100) / 100;
  const totalAmount = Math.round(seatPrice * guests + addOnPrice);
  const prebookingAmount = Math.round(totalAmount * getPrebookingPercentage());
  const commissionAmount = Math.round(totalAmount * getCommissionPercentage());

  return {
    seatPrice,
    totalAmount,
    prebookingAmount,
    commissionAmount,
    prebookingPercentage: getPrebookingPercentage(),
  };
};

const isBlockingStatus = (status) => BLOCKING_BOOKING_STATUSES.includes(status);

const canTransition = (from, to) => {
  if (from === to) return true;
  return (ALLOWED_TRANSITIONS[from] || []).includes(to);
};

const assertStatusTransition = (from, to) => {
  if (!BOOKING_STATUSES.includes(to)) {
    throw new BookingError('Invalid booking status');
  }
  if (!canTransition(from, to)) {
    throw new BookingError(`Booking cannot change from "${from}" to "${to}"`, 400, 'invalid_transition');
  }
};

module.exports = {
  DEFAULT_PREBOOKING_PERCENTAGE,
  DEFAULT_COMMISSION_PERCENTAGE,
  DEFAULT_PAYMENT_WINDOW_HOURS,
  DEFAULT_CANCELLATION_WINDOW_DAYS,
  BLOCKING_BOOKING_STATUSES,
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
  TIME_SLOTS,
  EVENT_TYPES,
  ALLOWED_TRANSITIONS,
  BookingError,
  getPrebookingPercentage,
  getCommissionPercentage,
  getPaymentWindowHours,
  getCancellationWindowDays,
  readString,
  readInteger,
  normalizeTimeSlot,
  normalizeEventType,
  normalizePhone,
  normalizeCnic,
  normalizeGuestsCount,
  normalizeTransactionId,
  normalizeCustomFood,
  calculateBookingAmounts,
  isBlockingStatus,
  canTransition,
  assertStatusTransition,
};
