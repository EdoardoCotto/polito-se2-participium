const AppError = require('./AppError');

class NotFoundError extends AppError {
  constructor(message = 'Not Found Resource') {
    super(message, 404); 
    this.name = 'NotFoundError';
  }
}

module.exports = NotFoundError