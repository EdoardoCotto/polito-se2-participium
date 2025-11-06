const AppError = require('./AppError');

class ConflictError extends AppError {
  constructor(message) {
    super(message);
    this.statusCode = 409;
    this.name = 'ConflictError';
  }
}

module.exports = ConflictError