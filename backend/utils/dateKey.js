const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

const getBusinessTimeZone = () => process.env.BUSINESS_TIMEZONE || 'Asia/Karachi';

const isValidDateKey = (value) => {
  if (typeof value !== 'string' || !DATE_KEY_PATTERN.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const assertDateKey = (value, field = 'date') => {
  if (!isValidDateKey(value)) {
    const error = new Error(`${field} must be a valid date in YYYY-MM-DD format`);
    error.status = 400;
    error.code = 'invalid_date';
    throw error;
  }
  return value;
};

// Booking dates are date-only values. They are stored as UTC midnight so the
// same calendar day is used by every server, regardless of server timezone.
const dateKeyToUtcDate = (dateKey) =>
  new Date(`${assertDateKey(dateKey)}T00:00:00.000Z`);

const toDateKey = (value) => {
  if (!value) return null;

  if (typeof value === 'string') {
    if (isValidDateKey(value)) return value;
    // Legacy booking dates may be full ISO strings; fall back to the UTC day.
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().slice(0, 10);
};

const getBusinessDateKey = (now = new Date(), timeZone = getBusinessTimeZone()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const values = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') values[part.type] = part.value;
  });

  return `${values.year}-${values.month}-${values.day}`;
};

const isPastDateKey = (dateKey, now = new Date()) =>
  assertDateKey(dateKey) < getBusinessDateKey(now);

const daysBetweenDateKeys = (fromKey, toKey) => {
  const from = dateKeyToUtcDate(fromKey).getTime();
  const to = dateKeyToUtcDate(toKey).getTime();
  return Math.round((to - from) / DAY_MS);
};

module.exports = {
  DATE_KEY_PATTERN,
  getBusinessTimeZone,
  isValidDateKey,
  assertDateKey,
  dateKeyToUtcDate,
  toDateKey,
  getBusinessDateKey,
  isPastDateKey,
  daysBetweenDateKeys,
};
