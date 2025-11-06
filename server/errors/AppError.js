class AppError extends Error {
  constructor(
    message,
    status
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
