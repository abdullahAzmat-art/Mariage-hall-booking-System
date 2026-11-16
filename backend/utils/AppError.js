// Operational errors describe expected failures (bad input, missing record,
// permission denied) and are safe to show to clients. Anything that is not an
// AppError is treated as a bug and its details are hidden in production.
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    // Alias kept so existing error classes such as BookingError and helpers
    // that read `error.status` keep working with the global handler.
    this.status = statusCode;
    this.isOperational = true;
    if (code) this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
