const AppError = require('./AppError');

class NotFoundError extends AppError {
  constructor(message) {
    super(message);
    this.statusCode = 404;
    this.name = 'NotFoundError';
  }
}

module.exports = NotFoundError