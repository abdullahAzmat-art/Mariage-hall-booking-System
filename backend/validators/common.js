const { z } = require('zod');

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

// Zod reports a type error for missing values, so distinguish "required" from
// "wrong type" to keep API error messages useful.
const stringError = (field) => (issue) =>
  issue.input === undefined || issue.input === null
    ? `${field} is required`
    : `${field} must be text`;

const objectId = (field = 'id') =>
  z
    .string({
      error: (issue) =>
        issue.input === undefined || issue.input === null
          ? `${field} is required`
          : `${field} must be a valid id`,
    })
    .trim()
    .regex(OBJECT_ID_PATTERN, `${field} must be a valid id`);

// Multipart forms send numbers as strings, so accept both and convert only
// non-empty string values. Empty strings must fail instead of becoming 0.
const preprocessNumber = (value) =>
  typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

const numberField = (field, { min = 0, max = Number.MAX_SAFE_INTEGER, integer = false } = {}) => {
  const inner0 = z.number({
    error: (issue) =>
      issue.input === undefined || issue.input === null
        ? `${field} is required`
        : `${field} must be a number`,
  });
  let inner = inner0.finite(`${field} must be a number`);

  if (integer) {
    inner = inner.int(`${field} must be a whole number`);
  }

  inner = inner.min(min, `${field} must be at least ${min}`).max(max, `${field} is too large`);

  return z.preprocess(preprocessNumber, inner);
};

const text = (field, { min = 1, max = 500 } = {}) =>
  z
    .string({ error: stringError(field) })
    .trim()
    .min(min, min <= 1 ? `${field} is required` : `${field} must be at least ${min} characters`)
    .max(max, `${field} is too long`);

const optionalText = (field, { max = 500 } = {}) =>
  z
    .string({ error: stringError(field) })
    .trim()
    .max(max, `${field} is too long`)
    .optional();

const email = () =>
  z
    .string({
      error: (issue) =>
        issue.input === undefined || issue.input === null
          ? 'email is required'
          : 'email must be text',
    })
    .trim()
    .toLowerCase()
    .max(254, 'email is too long')
    .email('Enter a valid email address');

const idParams = z.object({ id: objectId('id') });
const hallIdParams = z.object({ hallId: objectId('hallId') });

module.exports = {
  OBJECT_ID_PATTERN,
  stringError,
  objectId,
  numberField,
  text,
  optionalText,
  email,
  idParams,
  hallIdParams,
};
