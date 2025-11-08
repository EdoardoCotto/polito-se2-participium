const AppError = require('./AppError');

class BadRequestError extends AppError {
  constructor(message) {
    super(message);
    this.statusCode = 400;
    this.name = 'BadRequestError';
  }
}

module.exports = BadRequestError