const { isLoggedIn, isAdmin } = require('../../server/middlewares/authMiddleware');
const UnauthorizedError = require('../../server/errors/UnauthorizedError');

describe('authMiddleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      isAuthenticated: jest.fn(),
      user: {}
    };
    res = {};
    next = jest.fn();
  });

  describe('isLoggedIn', () => {
    it('should call next() if user is authenticated', () => {
      req.isAuthenticated.mockReturnValue(true);

      isLoggedIn(req, res, next);

      // Expect next to be called without error
      expect(next).toHaveBeenCalledWith();
    });

    it('should call next() with UnauthorizedError if user is not authenticated', () => {
      req.isAuthenticated.mockReturnValue(false);

      isLoggedIn(req, res, next);

      // Expect next to be called with UnauthorizedError instance
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('User not authenticated');
    });
  });

  describe('isAdmin', () => {
    it('should call next() if user is authenticated and is admin', () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { type: 'admin' };

      isAdmin(req, res, next);

      // Expect successful flow
      expect(next).toHaveBeenCalledWith();
    });

    it('should call next() with UnauthorizedError if user is authenticated but not admin', () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { type: 'citizen' };

      isAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('User is not admin');
    });

    it('should call next() with UnauthorizedError if user is not authenticated', () => {
      req.isAuthenticated.mockReturnValue(false);

      isAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('User not authenticated');
    });
  });
});
