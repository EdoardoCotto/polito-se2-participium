const {
  isLoggedIn,
  isAdmin,
  isMunicipal_public_relations_officer,
  isTechnicalOfficeStaff,
  isExternalMaintainer,
<<<<<<< HEAD
=======
  isInternalStaffOrMaintainer
>>>>>>> c951a75a6e707746e1925ca8487710214f131d35
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

  describe('isExternalMaintainer', () => {
<<<<<<< HEAD
    it('calls next when user type is external_maintainer', () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { type: 'external_maintainer' };
      // isExternalMaintainer does not check isAuthenticated; it checks user.type and calls next()
=======
    it('calls next if user is external_maintainer', () => {
      req.user = { type: 'external_maintainer' };
      res.status = jest.fn().mockReturnThis();
      res.json = jest.fn();
>>>>>>> c951a75a6e707746e1925ca8487710214f131d35
      isExternalMaintainer(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

<<<<<<< HEAD
    it('responds 403 when user type is not external_maintainer', () => {
      req.isAuthenticated.mockReturnValue(true);
=======
    it('returns 403 if user is not external_maintainer', () => {
>>>>>>> c951a75a6e707746e1925ca8487710214f131d35
      req.user = { type: 'citizen' };
      res.status = jest.fn().mockReturnThis();
      res.json = jest.fn();
      isExternalMaintainer(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access forbidden: external maintainer only' });
<<<<<<< HEAD
      expect(next).not.toHaveBeenCalled();
    });

    it('responds 403 when req.user is undefined (optional chaining)', () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = undefined;
=======
    });

    it('returns 403 if user is not set', () => {
      req.user = null;
>>>>>>> c951a75a6e707746e1925ca8487710214f131d35
      res.status = jest.fn().mockReturnThis();
      res.json = jest.fn();
      isExternalMaintainer(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access forbidden: external maintainer only' });
<<<<<<< HEAD
      expect(next).not.toHaveBeenCalled();
=======
    });
  });

  describe('isInternalStaffOrMaintainer', () => {
    it('should call next() if user is authenticated and is technical office staff', () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { type: 'urban_planner' };

      isInternalStaffOrMaintainer(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should call next() if user is authenticated and is external_maintainer', () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { type: 'external_maintainer' };

      isInternalStaffOrMaintainer(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should call next() if user is authenticated and is external_maintainer (typo version)', () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { type: 'external_maintainer' };

      isInternalStaffOrMaintainer(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should call next() with UnauthorizedError if user is authenticated but not authorized', () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { type: 'citizen' };

      isInternalStaffOrMaintainer(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Access forbidden: technical office staff or external maintainer only');
    });

    it('should call next() with UnauthorizedError if user is not authenticated', () => {
      req.isAuthenticated.mockReturnValue(false);

      isInternalStaffOrMaintainer(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('User not authenticated');
>>>>>>> c951a75a6e707746e1925ca8487710214f131d35
    });
  });
});
