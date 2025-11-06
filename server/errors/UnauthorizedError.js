export class UnauthorizedError extends AppError {
  constructor(message = 'Unhautorized user') {
    super(message, 401); 
    this.name = 'UnauthorizedError';
  }
}

module.exports = UnauthorizedError