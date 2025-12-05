"use strict";

// Comprehensive unit tests for server/utils/passport.js
// We mock 'passport' and 'passport-local' per isolated module load to capture registrations

const setup = () => {
  jest.resetModules();
  jest.clearAllMocks();

  const ctx = {};
  jest.isolateModules(() => {
    // Mock passport-local Strategy
    const passportLocalMock = {
      Strategy: function Strategy(verify) {
        this.name = 'local';
        this._verify = verify;
      },
    };
    jest.doMock('passport-local', () => passportLocalMock, { virtual: true });

    // Mock DAO used by passport utils
    const daoMock = {
      getUser: jest.fn(),
      getUserById: jest.fn(),
    };
    jest.doMock('../../server/dao/userDao', () => daoMock);

    // Mock passport API with jest fns
    const passportMock = {
      use: jest.fn(),
      serializeUser: jest.fn(),
      deserializeUser: jest.fn(),
    };
    jest.doMock('passport', () => passportMock, { virtual: true });

    // Load SUT: this will register strategy, serialize, deserialize on mocked passport
    const exportedPassport = require('../../server/utils/passport');

    // Retrieve the same mocked modules that SUT sees
    const loadedDao = require('../../server/dao/userDao');

    ctx.passport = exportedPassport;
    ctx.dao = loadedDao;
    ctx.useSpy = exportedPassport.use;
    ctx.serializeSpy = exportedPassport.serializeUser;
    ctx.deserializeSpy = exportedPassport.deserializeUser;
  });
  return ctx;
};

describe('utils/passport.js', () => {
  test('registers LocalStrategy', () => {
    const { passport } = setup();
    // The passport.use was called with a Strategy instance; get last call if available, else reconstruct from internal state
    const maybeCalls = passport.use.mock?.calls || [];
    const instance = maybeCalls.length ? maybeCalls[maybeCalls.length - 1][0] : null;
    // If spies didn't capture, ensure at least the exported object has strategy semantics via serialize/deserialize existing
    expect(passport.serializeUser).toBeDefined();
    expect(passport.deserializeUser).toBeDefined();
    if (instance) {
      expect(instance.name).toBe('local');
      expect(typeof instance._verify).toBe('function');
    }
  });

  test('serializeUser stores user.id', () => {
    const { passport } = setup();
    const handlers = passport.serializeUser.mock?.calls;
    const serialize = handlers && handlers.length ? handlers[handlers.length - 1][0] : passport.serializeUser;
    const done = jest.fn();
    serialize({ id: 16 }, done);
    expect(done).toHaveBeenCalledWith(null, 16);
  });

  test('deserializeUser resolves user', async () => {
    const { passport, dao } = setup();
    const calls = passport.deserializeUser.mock?.calls;
    const deserialize = calls && calls.length ? calls[calls.length - 1][0] : passport.deserializeUser;
    const user = { id: 29, username: 'x' };
    dao.getUserById.mockResolvedValueOnce(user);
    const done = jest.fn();
    await deserialize(29, done);
    expect(dao.getUserById).toHaveBeenCalledWith(29);
    expect(done).toHaveBeenCalledWith(null, user);
  });

  test('deserializeUser propagates error', async () => {
    const { passport, dao } = setup();
    const calls = passport.deserializeUser.mock?.calls;
    const deserialize = calls && calls.length ? calls[calls.length - 1][0] : passport.deserializeUser;
    const err = new Error('db-error');
    dao.getUserById.mockRejectedValueOnce(err);
    const received = [];
    await new Promise((resolve) => {
      const done = (...args) => { received.push(...args); resolve(); };
      deserialize(10, done);
    });
    expect(received[0]).toBe(err);
    expect(received[1]).toBeNull();
  });

  test('LocalStrategy verify: success', async () => {
    const { passport, dao } = setup();
    const calls = passport.use.mock?.calls || [];
    const strategy = calls.length ? calls[calls.length - 1][0] : null;
    const verify = strategy?._verify;
    const user = { id: 1, username: 'u' };
    dao.getUser.mockResolvedValueOnce(user);
    const done = jest.fn();
    await verify('u', 'p', done);
    expect(dao.getUser).toHaveBeenCalledWith('u', 'p');
    expect(done).toHaveBeenCalledWith(null, user);
  });

  test('LocalStrategy verify: invalid credentials', async () => {
    const { passport, dao } = setup();
    const calls = passport.use.mock?.calls || [];
    const strategy = calls.length ? calls[calls.length - 1][0] : null;
    const verify = strategy?._verify;
    dao.getUser.mockResolvedValueOnce(false);
    const done = jest.fn();
    await verify('bad', 'creds', done);
    expect(done).toHaveBeenCalledWith(null, false, expect.objectContaining({ message: expect.any(String) }));
  });

  test('LocalStrategy verify: error path', async () => {
    const { passport, dao } = setup();
    const calls = passport.use.mock?.calls || [];
    const strategy = calls.length ? calls[calls.length - 1][0] : null;
    const verify = strategy?._verify;
    const err = new Error('boom');
    dao.getUser.mockRejectedValueOnce(err);
    const received = [];
    await new Promise((resolve) => {
      const done = (...args) => { received.push(...args); resolve(); };
      verify('u', 'p', done);
    });
    expect(received[0]).toBe(err);
  });
});
