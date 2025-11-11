jest.mock('../../server/utils/passport', () => ({
  authenticate: jest.fn(),
}));

const sessionController = require('../../server/controller/sessionController');
const passport = require('../../server/utils/passport');
const AppError = require('../../server/errors/AppError');

describe('sessionController', () => {
  let req;
  let res;
  let next;

  const makeRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  });

  beforeEach(() => {
    req = {
      body: {},
      login: jest.fn((user, cb) => cb(null)),
      logout: jest.fn((cb) => cb(null)),
      isAuthenticated: jest.fn().mockReturnValue(false),
      user: {
        id: 1,
        username: 'alice',
        name: 'Alice',
        surname: 'Liddell',
        email: 'a@example.com',
        type: 'user',
      },
    };
    res = makeRes();
    next = jest.fn();
    jest.clearAllMocks();
  });

  // login
  it('login -> 200 on success', async () => {
    const user = { id: 2, username: 'bob', name: 'Bob', surname: 'Builder', type: 'admin' };
    passport.authenticate.mockImplementationOnce((_strategy, cb) => {
      return (_req, _res, _next) => cb(null, user, undefined);
    });
    await sessionController.login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: user.id,
      username: user.username,
      name: user.name,
      surname: user.surname,
      type: user.type,
    });
  });

  it('login -> AppError from authenticate mapped to status', async () => {
    const appErr = new AppError('Bad credentials', 400);
    passport.authenticate.mockImplementationOnce((_strategy, cb) => {
      return (_req, _res, _next) => cb(appErr);
    });
    await sessionController.login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Bad credentials' });
    expect(next).not.toHaveBeenCalled();
  });

  it('login -> generic error from authenticate calls next(err)', async () => {
    const err = new Error('boom');
    passport.authenticate.mockImplementationOnce((_strategy, cb) => {
      return (_req, _res, _next) => cb(err);
    });
    await sessionController.login(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('login -> 401 when user not found (with info.message)', async () => {
    passport.authenticate.mockImplementationOnce((_strategy, cb) => {
      return (_req, _res, _next) => cb(null, false, { message: 'Invalid' });
    });
    await sessionController.login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid' });
  });

  it('login -> 401 when user not found (no info)', async () => {
    passport.authenticate.mockImplementationOnce((_strategy, cb) => {
      return (_req, _res, _next) => cb(null, false, undefined);
    });
    await sessionController.login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid username or password' });
  });

  it('login -> AppError from req.login mapped to status', async () => {
    const user = { id: 3, username: 'c' };
    passport.authenticate.mockImplementationOnce((_strategy, cb) => {
      return (_req, _res, _next) => cb(null, user, undefined);
    });
    req.login = jest.fn((_user, cb) => cb(new AppError('Denied', 403)));
    await sessionController.login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Denied' });
  });

  it('login -> generic error from req.login calls next(err)', async () => {
    const user = { id: 3, username: 'c' };
    const err = new Error('oops');
    passport.authenticate.mockImplementationOnce((_strategy, cb) => {
      return (_req, _res, _next) => cb(null, user, undefined);
    });
    req.login = jest.fn((_user, cb) => cb(err));
    await sessionController.login(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
  });

  // logout
  it('logout -> 401 if not authenticated', async () => {
    req.isAuthenticated = jest.fn().mockReturnValue(false);
    await sessionController.logout(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not authenticated' });
  });

  it('logout -> 200 on success when authenticated', async () => {
    req.isAuthenticated = jest.fn().mockReturnValue(true);
    req.logout = jest.fn((cb) => cb(null));
    await sessionController.logout(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
  });

  it('logout -> AppError mapped to status', async () => {
    req.isAuthenticated = jest.fn().mockReturnValue(true);
    req.logout = jest.fn((cb) => cb(new AppError('Forbidden', 403)));
    await sessionController.logout(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
  });

  it('logout -> generic error calls next(err)', async () => {
    const err = new Error('fail');
    req.isAuthenticated = jest.fn().mockReturnValue(true);
    req.logout = jest.fn((cb) => cb(err));
    await sessionController.logout(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
  });

  // getCurrentSession
  it('getCurrentSession -> 200 when authenticated', () => {
    req.isAuthenticated = jest.fn().mockReturnValue(true);
    sessionController.getCurrentSession(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: req.user.id,
      username: req.user.username,
      name: req.user.name,
      surname: req.user.surname,
      email: req.user.email,
      type: req.user.type,
    });
  });

  it('getCurrentSession -> 401 when not authenticated', () => {
    req.isAuthenticated = jest.fn().mockReturnValue(false);
    sessionController.getCurrentSession(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not authenticated' });
  });
});
