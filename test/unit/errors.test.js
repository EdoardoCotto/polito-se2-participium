const AppError = require('../../server/errors/AppError');
const BadRequestError = require('../../server/errors/BadRequestError');
const ConflictError = require('../../server/errors/ConflictError');
const NotFoundError = require('../../server/errors/NotFoundError');
const UnauthorizedError = require('../../server/errors/UnauthorizedError');

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an error with message and status', () => {
      const message = 'Test error';
      const status = 500;
      const error = new AppError(message, status);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(status);
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test', 500);
      expect(error.stack).toBeDefined();
    });

    it('should work with different status codes', () => {
      const error400 = new AppError('Bad Request', 400);
      expect(error400.statusCode).toBe(400);

      const error404 = new AppError('Not Found', 404);
      expect(error404.statusCode).toBe(404);

      const error500 = new AppError('Server Error', 500);
      expect(error500.statusCode).toBe(500);
    });
  });

  describe('BadRequestError', () => {
    it('should create an error with 400 status code', () => {
      const message = 'Invalid input';
      const error = new BadRequestError(message);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('BadRequestError');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(BadRequestError);
    });

    it('should have correct properties', () => {
      const error = new BadRequestError('Test message');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('statusCode');
      expect(error).toHaveProperty('name');
      expect(error).toHaveProperty('stack');
    });
  });

  describe('ConflictError', () => {
    it('should create an error with 409 status code', () => {
      const message = 'Resource conflict';
      const error = new ConflictError(message);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('ConflictError');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ConflictError);
    });

    it('should have correct properties', () => {
      const error = new ConflictError('Test conflict');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('statusCode');
      expect(error).toHaveProperty('name');
      expect(error).toHaveProperty('stack');
    });
  });

  describe('NotFoundError', () => {
    it('should create an error with 404 status code', () => {
      const message = 'Resource not found';
      const error = new NotFoundError(message);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(NotFoundError);
    });

    it('should have correct properties', () => {
      const error = new NotFoundError('Not found');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('statusCode');
      expect(error).toHaveProperty('name');
      expect(error).toHaveProperty('stack');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create an error with 401 status code', () => {
      const message = 'Unauthorized access';
      const error = new UnauthorizedError(message);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('UnauthorizedError');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(UnauthorizedError);
    });

    it('should have correct properties', () => {
      const error = new UnauthorizedError('Unauthorized');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('statusCode');
      expect(error).toHaveProperty('name');
      expect(error).toHaveProperty('stack');
    });
  });

  describe('Error inheritance chain', () => {
    it('should maintain proper inheritance chain', () => {
      const appError = new AppError('Test', 500);
      const badRequest = new BadRequestError('Bad request');
      const conflict = new ConflictError('Conflict');
      const notFound = new NotFoundError('Not found');
      const unauthorized = new UnauthorizedError('Unauthorized');

      expect(badRequest instanceof AppError).toBe(true);
      expect(conflict instanceof AppError).toBe(true);
      expect(notFound instanceof AppError).toBe(true);
      expect(unauthorized instanceof AppError).toBe(true);

      expect(badRequest instanceof Error).toBe(true);
      expect(conflict instanceof Error).toBe(true);
      expect(notFound instanceof Error).toBe(true);
      expect(unauthorized instanceof Error).toBe(true);
    });
  });
});
