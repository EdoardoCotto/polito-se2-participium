const AppError = require('./AppError');

class UnauthorizedError extends AppError {
  constructor(message) {
    super(message);
    this.statusCode = 401;
    this.name = 'UnauthorizedError';
  }
}

module.exports = UnauthorizedError;