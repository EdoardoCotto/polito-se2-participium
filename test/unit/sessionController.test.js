const sessionController = require('../../server/controller/sessionController');
const passport = require('../../server/utils/passport');

describe('Session Controller - integration tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      login: jest.fn((user, cb) => cb(null)),
      logout: jest.fn((cb) => cb(null)),
      isAuthenticated: jest.fn().mockReturnValue(false),
      user: { id: 1, username: 'alice', name: 'Alice', surname: 'Liddell', email: 'a@example.com', type: 'user' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('login fails with invalid credentials', async () => {
    req.body = { username: 'wrong', password: 'wrong' };
    await sessionController.login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('getCurrentSession returns 401 if not authenticated', () => {
    sessionController.getCurrentSession(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
