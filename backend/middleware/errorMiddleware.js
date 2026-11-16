const AppError = require('../utils/AppError');

const isProduction = () => process.env.NODE_ENV === 'production';

// Every error is reduced to one shape here so controllers and services do not
// need to know about Mongoose internals or body-parser failures.
const normalizeError = (error) => {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      isOperational: true,
    };
  }

  // express.json() throws this when the request body is not valid JSON.
  if (error.type === 'entity.parse.failed') {
    return {
      statusCode: 400,
      message: 'Malformed JSON in request body',
      code: 'invalid_json',
      isOperational: true,
    };
  }

  // Thrown when a route parameter or field cannot be cast, e.g. a non-ObjectId
  // passed to /api/bookings/:id.
  if (error.name === 'CastError') {
    const field =
      error.path === '_id' || error.path === 'id'
        ? 'identifier'
        : `value for "${error.path}"`;
    return {
      statusCode: 400,
      message: `Invalid ${field}`,
      code: 'invalid_value',
      isOperational: true,
    };
  }

  // MongoDB unique index violation, e.g. duplicate email or transaction ID.
  if (error.code === 11000) {
    const fields = Object.keys(error.keyValue || error.keyPattern || {});
    return {
      statusCode: 409,
      message: fields.length
        ? `Duplicate value for ${fields.join(', ')}. Please use a different value.`
        : 'Duplicate value. Please use a different value.',
      code: 'duplicate_value',
      isOperational: true,
    };
  }

  // Mongoose schema validation (failed required, enum, min, etc.).
  if (error.name === 'ValidationError' && error.errors) {
    const errors = Object.values(error.errors).map(({ path, message }) => ({
      field: path,
      message,
    }));
    return {
      statusCode: 400,
      message: 'Validation failed',
      code: 'validation_failed',
      errors,
      isOperational: true,
    };
  }

  // Errors that already carry an HTTP status, such as BookingError or
  // http-errors instances passed with next(error).
  const statusCode = error.statusCode ?? error.status;
  if (Number.isInteger(statusCode)) {
    return {
      statusCode,
      message: error.message || 'Request failed',
      code: error.code,
      isOperational: statusCode < 500,
    };
  }

  return {
    statusCode: 500,
    // Kept for development visibility; the handler masks it in production
    // because isOperational is false.
    message: error.message || 'Something went wrong',
    isOperational: false,
  };
};

// Registered after all routes. Any request that fell through gets a 404 that
// flows into the same global handler as every other error.
const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.path}`, 404, 'route_not_found'));
};

// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, next) => {
  // SSE and other streaming responses may already be committed; hand back to
  // Express so it closes the connection instead of writing a second response.
  if (res.headersSent) {
    return next(err);
  }

  const normalized = normalizeError(err);
  const hideDetails = isProduction() && !normalized.isOperational;

  if (!normalized.isOperational || normalized.statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  return res.status(normalized.statusCode).json({
    status: normalized.statusCode >= 500 ? 'error' : 'fail',
    message: hideDetails
      ? 'Something went wrong. Please try again later.'
      : normalized.message,
    ...(normalized.code ? { code: normalized.code } : {}),
    ...(normalized.errors ? { errors: normalized.errors } : {}),
    ...(isProduction() ? {} : { stack: err?.stack }),
  });
};

module.exports = { notFoundHandler, globalErrorHandler };
