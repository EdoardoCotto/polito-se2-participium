// passport.test.js - unit coverage for server/utils/passport.js

// Mock passport to capture strategy and serializers
jest.mock('passport', () => {
  const handlers = { serialize: null, deserialize: null };
  const mock = {
    _handlers: handlers,
    _strategy: null,
    use: jest.fn((strategyInstance) => {
      mock._strategy = strategyInstance;
    }),
    serializeUser: jest.fn((cb) => {
      handlers.serialize = cb;
    }),
    deserializeUser: jest.fn((cb) => {
      handlers.deserialize = cb;
    }),
  };
  return mock;
});

// Mock passport-local Strategy to store verify callback
jest.mock('passport-local', () => ({
  Strategy: function Strategy(verify) {
    // Support ctor with verify as first arg
    this.name = 'local';
    this._verify = verify;
  },
}));

// Mock userDao used by passport utils
jest.mock('../../server/dao/userDao', () => ({
  getUser: jest.fn(),
  getUserById: jest.fn(),
}));

let userDao;

describe('utils/passport configuration', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    // Re-require mocks after reset to avoid stale references
    userDao = require('../../server/dao/userDao');
  });

  test('serializeUser calls done(null, user.id)', async () => {
    const passportInstance = require('../../server/utils/passport');
    const serialize = passportInstance._handlers.serialize;
    expect(typeof serialize).toBe('function');
    const done = jest.fn();
    serialize({ id: 42 }, done);
    expect(done).toHaveBeenCalledWith(null, 42);
  });

  test('deserializeUser resolves user and calls done(null, user)', async () => {
    const user = { id: 7, username: 'u' };
    userDao.getUserById.mockResolvedValueOnce(user);
    const passportInstance = require('../../server/utils/passport');
    const deserialize = passportInstance._handlers.deserialize;
    const done = jest.fn();
    await deserialize(7, done);
    expect(userDao.getUserById).toHaveBeenCalledWith(7);
    expect(done).toHaveBeenCalledWith(null, user);
  });

  test('deserializeUser propagates error with done(err, null)', async () => {
    const err = new Error('db fail');
    userDao.getUserById.mockRejectedValueOnce(err);
    const passportInstance = require('../../server/utils/passport');
    const deserialize = passportInstance._handlers.deserialize;
    const received = [];
    await new Promise((resolve) => {
      const done = (...args) => { received.push(...args); resolve(); };
      deserialize(9, done);
    });
    expect(received[0]).toBe(err);
    expect(received[1]).toBeNull();
  });

  test('LocalStrategy verify: success returns user', async () => {
    const user = { id: 1, username: 'u' };
    userDao.getUser.mockResolvedValueOnce(user);
    const passportInstance = require('../../server/utils/passport');
    const verify = passportInstance._strategy._verify;
    const done = jest.fn();
    await verify('u', 'p', done);
    expect(userDao.getUser).toHaveBeenCalledWith('u', 'p');
    expect(done).toHaveBeenCalledWith(null, user);
  });

  test('LocalStrategy verify: invalid user returns done(null, false, message)', async () => {
    userDao.getUser.mockResolvedValueOnce(null);
    const passportInstance = require('../../server/utils/passport');
    const verify = passportInstance._strategy._verify;
    const done = jest.fn();
    await verify('bad', 'creds', done);
    expect(done).toHaveBeenCalledWith(null, false, expect.objectContaining({ message: expect.any(String) }));
  });

  test('LocalStrategy verify: error path calls done(err)', async () => {
    const err = new Error('boom');
    userDao.getUser.mockRejectedValueOnce(err);
    const passportInstance = require('../../server/utils/passport');
    const verify = passportInstance._strategy._verify;
    const received = [];
    await new Promise((resolve) => {
      const done = (...args) => { received.push(...args); resolve(); };
      verify('u', 'p', done);
    });
    expect(received[0]).toBe(err);
  });
});
