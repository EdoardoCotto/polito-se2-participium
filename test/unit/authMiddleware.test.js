const { 
  isLoggedIn, 
  isAdmin, 
  isMunicipal_public_relations_officer,
  isTechnicalOfficeStaff 
} = require('../../server/middlewares/authMiddleware');
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

  describe('isMunicipal_public_relations_officer', () => {
    it('calls next if authenticated and has municipal_public_relations_officer role', () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { type: 'municipal_public_relations_officer' };
      isMunicipal_public_relations_officer(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('calls next with UnauthorizedError if authenticated but wrong role', () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { type: 'citizen' };
      isMunicipal_public_relations_officer(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const err = next.mock.calls[0][0];
      expect(err.message).toBe('User is not admin'); // message in middleware
    });

    it('calls next with UnauthorizedError if not authenticated', () => {
      req.isAuthenticated.mockReturnValue(false);
      isMunicipal_public_relations_officer(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const err = next.mock.calls[0][0];
      expect(err.message).toBe('User not authenticated');
    });
  });

  describe('isTechnicalOfficeStaff', () => {
    it('calls next if authenticated and technical office staff role', () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { type: 'urban_planner' }; // one of TECHNICAL_OFFICER_ROLES
      isTechnicalOfficeStaff(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('calls next with UnauthorizedError if authenticated but not technical staff', () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { type: 'citizen' };
      isTechnicalOfficeStaff(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const err = next.mock.calls[0][0];
      expect(err.message).toBe('User is not a technical office staff member');
    });

    it('calls next with UnauthorizedError if not authenticated', () => {
      req.isAuthenticated.mockReturnValue(false);
      isTechnicalOfficeStaff(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const err = next.mock.calls[0][0];
      expect(err.message).toBe('User not authenticated');
    });
  });
});
