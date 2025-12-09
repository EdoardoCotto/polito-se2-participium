"use strict";

// Nota: con moduleNameMapper in jest.config, 'sqlite3' punta a '__mock__/sqlite3.js'
// Usiamo quel mock anche per i test "non-mockati" iniziali, evitando il DB reale.
// Not using Database.mockX directly; we'll use per-test jest.doMock with withSqliteMock

// Bcrypt is mocked per isolated load to avoid cross-file interference
// The per-test factory sets sensible defaults and is accessible via require('bcrypt') inside withSqliteMock

let dao;

// helpers
const unique = (() => {
  let n = 0;
  return (prefix = 'unit') => `${prefix}_${Date.now()}_${n++}`;
})();

// Helper to mock sqlite3 and bcrypt before loading the DAO; available to all tests
const withSqliteMock = async (impls, fn) => {
  const { getImpl, runImpl, allImpl } = impls || {};
  jest.resetModules();
  // Provide an isolated bcrypt mock instance per invocation
  const localBcrypt = {
    compare: jest.fn((pw, hash, cb) => cb(null, false)),
    // Support both callback and promise styles
    genSalt: jest.fn((rounds, cb) => {
      if (typeof cb === 'function') {
        cb(null, 'mock_salt');
        return undefined;
      }
      return Promise.resolve('mock_salt');
    }),
    hash: jest.fn((password, salt, cb) => {
      if (typeof cb === 'function') {
        cb(null, 'mock_hash');
        return undefined;
      }
      return Promise.resolve('mock_hash');
    }),
  };
  jest.doMock('bcrypt', () => localBcrypt, { virtual: true });

    const defaultGet = (_sql, _params, cb2) => cb2(null, undefined);
    const defaultRun = (_sql, _params, cb2) => cb2.call({ lastID: 100, changes: 1 }, null);
    const defaultAll = (_sql, _params, cb2) => cb2(null, []);
  jest.doMock('sqlite3', () => {
    const base = {
      Database: function () {
        return {
          get: getImpl || defaultGet,
          run: runImpl || defaultRun,
          all: allImpl || defaultAll,
        };
      },
    };
    return {
      ...base,
      verbose: () => base,
    };
  }, { virtual: true });

  let localDao;
  jest.isolateModules(() => {
    // eslint-disable-next-line global-require
    localDao = require('../../server/dao/userDao');
  });

  try {
    await fn(localDao);
  } finally {
    jest.resetModules();
  }
};

describe('userDao Functions', () => {

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    // Il dao verrà caricato dentro i test tramite withSqliteMock
  });

  describe('getUser', () => {
    test('should return user when credentials are correct', async () => {
      const username = unique('u');
      const email = `${unique('e')}@example.com`;
      await withSqliteMock(
        {
          runImpl: (_s, _p, cb) => cb.call({ lastID: 11 }, null),
          getImpl: (_s, _p, cb) => cb(null, { id: 11, username, name: 'John', surname: 'Doe', type: 'citizen', password: 'stored_hash' }),
        },
        async (d) => {
          const bcryptMod = require('bcrypt');
          bcryptMod.compare.mockImplementation((pw, hash, cb) => cb(null, true));
          const created = await d.createUser({ username, email, name: 'John', surname: 'Doe', password: 'password123', type: 'citizen' });
          const result = await d.getUser(username, 'password123');
          expect(result).toEqual({ id: created.id, username, name: 'John', surname: 'Doe', type: 'citizen' });
          expect(require('bcrypt').compare).toHaveBeenCalled();
        }
      );
    });

    test('should return false when user not found', async () => {
      await withSqliteMock(
        { getImpl: (_s, _p, cb) => cb(null, undefined) },
        async (d) => {
          const result = await d.getUser('nonexistent', 'password');
          expect(result).toBe(false);
        }
      );
    });

    test('should return false when password is incorrect', async () => {
      const username = unique('u');
      const email = `${unique('e')}@example.com`;
      await withSqliteMock(
        { getImpl: (_s, _p, cb) => cb(null, { id: 1, username, name: 'A', surname: 'B', type: 'citizen', password: 'stored_hash' }) },
        async (d) => {
          const bcryptMod = require('bcrypt');
          bcryptMod.compare.mockImplementation((pw, hash, cb) => cb(null, false));
          const result = await d.getUser(username, 'wrongpassword');
          expect(result).toBe(false);
        }
      );
    });

    
  });

  describe('getUserById', () => {
    test('should return user by id', async () => {
      const username = unique('u');
      const email = `${unique('e')}@example.com`;
      const id = 123;
      await withSqliteMock(
        { getImpl: (_s, _p, cb) => cb(null, { id, username, email, name: 'John', surname: 'Doe', type: 'citizen' }) },
        async (d) => {
          const result = await d.getUserById(id);
          expect(result).toMatchObject({ id, username, email, name: 'John', surname: 'Doe', type: 'citizen' });
        }
      );
    });

    test('should return undefined when user not found', async () => {
      await withSqliteMock(
        { getImpl: (_s, _p, cb) => cb(null, undefined) },
        async (d) => {
          const result = await d.getUserById(9999999);
          expect(result).toBeUndefined();
        }
      );
    });

    // Skip: non forziamo errori DB qui
  });

  describe('getUserByUsername', () => {
    test('should return user by username', async () => {
      const username = unique('u');
      const id = 77;
      await withSqliteMock(
        { getImpl: (_s, _p, cb) => cb(null, { id }) },
        async (d) => {
          const result = await d.getUserByUsername(username);
          expect(result).toEqual({ id });
        }
      );
    });

    test('should return undefined when user not found', async () => {
      await withSqliteMock(
        { getImpl: (_s, _p, cb) => cb(null, undefined) },
        async (d) => {
          const result = await d.getUserByUsername(`nonexistent_${Date.now()}`);
          expect(result).toBeUndefined();
        }
      );
    });

    // Skip: non forziamo errori DB qui
  });

  describe('getUserByEmail', () => {
    test('should return user by email', async () => {
      const email = `${unique('e')}@example.com`;
      const id = 88;
      await withSqliteMock(
        { getImpl: (_s, _p, cb) => cb(null, { id }) },
        async (d) => {
          const result = await d.getUserByEmail(email);
          expect(result).toEqual({ id });
        }
      );
    });

    test('should return undefined when user not found', async () => {
      await withSqliteMock(
        { getImpl: (_s, _p, cb) => cb(null, undefined) },
        async (d) => {
          const result = await d.getUserByEmail(`nonexistent_${Date.now()}@example.com`);
          expect(result).toBeUndefined();
        }
      );
    });

    // Skip: non forziamo errori DB qui
  });

  describe('createUser', () => {
    test('should create new user successfully', async () => {
      const newUser = {
        username: unique('newuser'),
        email: `${unique('new')}@example.com`,
        name: 'Jane',
        surname: 'Smith',
        password: 'password123',
        type: 'citizen'
      };

      await withSqliteMock(
          { runImpl: (_s, _p, cb) => cb.call({ lastID: 201 }, null) },
        async (d) => {
          const result = await d.createUser(newUser);
          expect(require('bcrypt').genSalt).toHaveBeenCalled();
          expect(require('bcrypt').hash).toHaveBeenCalledWith('password123', 'mock_salt');
          expect(result).toEqual({ id: 201, username: newUser.username, email: newUser.email, name: 'Jane', surname: 'Smith', type: 'citizen' });
        }
      );
    });

    test('should use default type citizen when not specified', async () => {
      const newUser = {
        username: unique('newuser'),
        email: `${unique('new')}@example.com`,
        name: 'Jane',
        surname: 'Smith',
        password: 'password123'
      };

      await withSqliteMock(
        { runImpl: (_s, _p, cb) => cb.call({ lastID: 301 }, null) },
        async (d) => {
          const result = await d.createUser(newUser);
          expect(result.type).toBe('citizen');
        }
      );
    });

    test('should reject on database error', async () => {
      const username = unique('newuser');
      const email = `${unique('new')}@example.com`;
      await withSqliteMock(
        {
          // simulate constraint violation on second insert
          runImpl: (() => {
            let called = 0;
            return (_s, _p, cb) => {
              called += 1;
              if (called === 1) cb.call({ lastID: 999 }, null);
              else cb(new Error('SQLITE_CONSTRAINT'));
            };
          })(),
        },
        async (d) => {
          await d.createUser({ username, email, name: 'Jane', surname: 'Smith', password: 'password123' });
          await expect(d.createUser({ username, email, name: 'Jane', surname: 'Smith', password: 'password123' })).rejects.toThrow('SQLITE_CONSTRAINT');
        }
      );
    });

    test('should reject on bcrypt genSalt error', async () => {
      const newUser = {
        username: 'newuser',
        email: 'new@example.com',
        name: 'Jane',
        surname: 'Smith',
        password: 'password123'
      };
      await withSqliteMock({}, async (d) => {
        const bcryptMod = require('bcrypt');
        bcryptMod.genSalt.mockRejectedValue(new Error('Bcrypt Error'));
        await expect(d.createUser(newUser)).rejects.toThrow('Bcrypt Error');
      });
    });

    test('should reject on bcrypt hash error', async () => {
      const newUser = {
        username: 'newuser',
        email: 'new@example.com',
        name: 'Jane',
        surname: 'Smith',
        password: 'password123'
      };
      await withSqliteMock({}, async (d) => {
        const bcryptMod = require('bcrypt');
        bcryptMod.hash.mockRejectedValue(new Error('Hash Error'));
        await expect(d.createUser(newUser)).rejects.toThrow('Hash Error');
      });
    });

    test('should reject when bcrypt.compare errors', async () => {
      const username = unique('u');
      await withSqliteMock(
        { getImpl: (_s, _p, cb) => cb(null, { id: 1, username, name: 'A', surname: 'B', type: 'citizen', password: 'stored_hash' }) },
        async (d) => {
          const bcryptMod = require('bcrypt');
          bcryptMod.compare.mockImplementation((pw, hash, cb) => cb(new Error('Compare Error')));
          await expect(d.getUser(username, 'pw')).rejects.toThrow('Compare Error');
        }
      );
    });
  });

  describe('updateUserTypeById', () => {
    test('should update user type successfully', async () => {
      await withSqliteMock(
        { runImpl: (_s, _p, cb) => cb.call({ changes: 1 }, null) },
        async (d) => {
          const id = 501;
          const result = await d.updateUserTypeById(id, 'municipal_public_relations_officer');
          expect(result).toEqual({ id, type: 'municipal_public_relations_officer' });
        }
      );
    });

    test('should return null when no row updated', async () => {
      await withSqliteMock(
        { runImpl: (_s, _p, cb) => cb.call({ changes: 0 }, null) },
        async (d) => {
          const result = await d.updateUserTypeById(9999999, 'municipal_public_relations_officer');
          expect(result).toBeNull();
        }
      );
    });

    test('should reject invalid role', async () => {
      await withSqliteMock({}, async (d) => {
        await expect(d.updateUserTypeById(1, 'invalid_role')).rejects.toThrow('Invalid role');
      });
    });

    // Skip: non forziamo errori DB qui
  });

  describe('findMunicipalityUsers', () => {
    test('should return municipality users', async () => {
      await withSqliteMock(
        { allImpl: (_s, _p, cb) => cb(null, [{ username: 'municipal_user' }]) },
        async (d) => {
          const result = await d.findMunicipalityUsers();
          expect(Array.isArray(result)).toBe(true);
          expect(result.some(r => r.username === 'municipal_user')).toBe(true);
        }
      );
    });

    // Skip: altri casi non forzabili senza mock del DB
  });

  describe('getExternalMaintainers', () => {
    test('returns maintainers list', async () => {
      await withSqliteMock(
        { allImpl: (_s, _p, cb) => cb(null, [{ id: 1, type: 'external_mantainer' }]) },
        async (d) => {
          const res = await d.getExternalMaintainers();
          expect(Array.isArray(res)).toBe(true);
          expect(res[0].type).toBe('external_mantainer');
        }
      );
    });

    test('rejects on DB error', async () => {
      await withSqliteMock(
        { allImpl: (_s, _p, cb) => cb(new Error('DB Error')) },
        async (d) => {
          await expect(d.getExternalMaintainers()).rejects.toThrow('DB Error');
        }
      );
    });
  });

  describe('updateUserProfile', () => {
    test('rejects when user not found', async () => {
      await withSqliteMock(
        { getImpl: (_s, _p, cb) => cb(null, undefined) },
        async (d) => {
          await expect(d.updateUserProfile(999999, {})).rejects.toThrow('User not found');
        }
      );
    });

    test('resolves with id only when no fields provided', async () => {
      await withSqliteMock(
        { getImpl: (_s, _p, cb) => cb(null, { telegram_nickname: null, personal_photo_path: null, mail_notifications: 0 }) },
        async (d) => {
          const uId = 700;
          const res = await d.updateUserProfile(uId, {});
          expect(res).toEqual({ id: uId });
        }
      );
    });

    test('skips null-to-null updates and returns id only', async () => {
      await withSqliteMock(
        { getImpl: (_s, _p, cb) => cb(null, { telegram_nickname: null, personal_photo_path: null, mail_notifications: 0 }) },
        async (d) => {
          const uId = 701;
          const res = await d.updateUserProfile(uId, { telegram_nickname: null });
          expect(res).toEqual({ id: uId });
        }
      );
    });

    test('updates all fields and returns updated values', async () => {
      await withSqliteMock(
        {
          getImpl: (_s, _p, cb) => cb(null, { telegram_nickname: null, personal_photo_path: null, mail_notifications: 0 }),
          runImpl: (_s, _p, cb) => cb(null),
        },
        async (d) => {
          const uId = 702;
          const updates = { telegram_nickname: 'newNick', personal_photo_path: 'new.png', mail_notifications: 1 };
          const result = await d.updateUserProfile(uId, updates);
          expect(result).toEqual({ id: uId, ...updates });
        }
      );
    });

    test('partial updates including setting null from non-null', async () => {
      await withSqliteMock(
        {
          getImpl: (_s, _p, cb) => cb(null, { telegram_nickname: null, personal_photo_path: 'has.png', mail_notifications: 1 }),
          runImpl: (_s, _p, cb) => cb(null),
        },
        async (d) => {
          const uId = 703;
          const result = await d.updateUserProfile(uId, { telegram_nickname: 'nick', personal_photo_path: null });
          expect(result).toEqual({ id: uId, telegram_nickname: 'nick', personal_photo_path: null });
        }
      );
    });

    // Skip: non forziamo errori DB qui
  });

  describe('additional null branches for updateUserProfile', () => {
    test('sets telegram_nickname from non-null to null', async () => {
      await withSqliteMock(
        {
          getImpl: (_s, _p, cb) => cb(null, { telegram_nickname: 'temp', personal_photo_path: null, mail_notifications: 0 }),
          runImpl: (_s, _p, cb) => cb(null),
        },
        async (d) => {
          const uId = 704;
          const res = await d.updateUserProfile(uId, { telegram_nickname: null });
          expect(res).toEqual({ id: uId, telegram_nickname: null });
        }
      );
    });

    // Note: DB schema forbids NULL on mail_notifications; skipping null test
  });

  describe('error branches with mocked sqlite3', () => {
    // using top-level withSqliteMock

    test('getUser rejects on DB error', async () => {
      await withSqliteMock(
        { getImpl: (_s, _p, cb) => cb(new Error('DB Error')) },
        async (d) => {
          await expect(d.getUser('u', 'p')).rejects.toThrow('DB Error');
        }
      );
    });

    test('getUserById rejects on DB error', async () => {
      await withSqliteMock(
        { getImpl: (_s, _p, cb) => cb(new Error('DB Error')) },
        async (d) => {
          await expect(d.getUserById(1)).rejects.toThrow('DB Error');
        }
      );
    });

    test('getUserByUsername rejects on DB error', async () => {
      await withSqliteMock(
        { getImpl: (_s, _p, cb) => cb(new Error('DB Error')) },
        async (d) => {
          await expect(d.getUserByUsername('u')).rejects.toThrow('DB Error');
        }
      );
    });

    test('getUserByEmail rejects on DB error', async () => {
      await withSqliteMock(
        { getImpl: (_s, _p, cb) => cb(new Error('DB Error')) },
        async (d) => {
          await expect(d.getUserByEmail('e@example.com')).rejects.toThrow('DB Error');
        }
      );
    });

    test('updateUserTypeById rejects on DB error', async () => {
      await withSqliteMock(
        { runImpl: (_s, _p, cb) => cb(new Error('DB Error')) },
        async (d) => {
          await expect(d.updateUserTypeById(1, 'municipal_public_relations_officer')).rejects.toThrow('DB Error');
        }
      );
    });

    test('findMunicipalityUsers rejects on DB error', async () => {
      await withSqliteMock(
        { allImpl: (_s, _p, cb) => cb(new Error('DB Error')) },
        async (d) => {
          await expect(d.findMunicipalityUsers()).rejects.toThrow('DB Error');
        }
      );
    });

    test('updateUserProfile rejects on select error', async () => {
      await withSqliteMock(
        { getImpl: (_s, _p, cb) => cb(new Error('Select Error')) },
        async (d) => {
          await expect(d.updateUserProfile(1, {})).rejects.toThrow('Select Error');
        }
      );
    });

    test('updateUserProfile rejects on update run error', async () => {
      await withSqliteMock(
        {
          getImpl: (_s, _p, cb) => cb(null, { telegram_nickname: 'x', personal_photo_path: 'y', mail_notifications: 0 }),
          runImpl: (_s, _p, cb) => cb(new Error('Update Error')),
        },
        async (d) => {
          await expect(d.updateUserProfile(7, { telegram_nickname: 'z' })).rejects.toThrow('Update Error');
        }
      );
    });
  });

  describe('getUser bcrypt error coverage', () => {
    test('getUser rejects on bcrypt compare error', async () => {
      await withSqliteMock(
        {
          getImpl: (_s, _p, cb) => cb(null, { id: 1, username: 'user', password: 'hash', name: 'N', surname: 'S', type: 'citizen' }),
        },
        async (d) => {
          const bcryptMod = require('bcrypt');
          bcryptMod.compare.mockImplementation((pw, hash, cb) => cb(new Error('Bcrypt error'), null));
          await expect(d.getUser('user', 'password')).rejects.toThrow('Bcrypt error');
        }
      );
    });
  });

  describe('getExternalMaintainers', () => {
    test('returns list of external maintainers', async () => {
      await withSqliteMock(
        {
          allImpl: (_s, _p, cb) => cb(null, [{ id: 1, username: 'm1', type: 'external_mantainer' }]),
        },
        async (d) => {
          const result = await d.getExternalMaintainers();
          expect(result).toEqual([{ id: 1, username: 'm1', type: 'external_mantainer' }]);
        }
      );
    });

    test('rejects on database error', async () => {
      await withSqliteMock(
        {
          allImpl: (_s, _p, cb) => cb(new Error('DB error'), null),
        },
        async (d) => {
          await expect(d.getExternalMaintainers()).rejects.toThrow('DB error');
        }
      );
    });

    test('returns empty array when no maintainers', async () => {
      await withSqliteMock(
        {
          allImpl: (_s, _p, cb) => cb(null, null),
        },
        async (d) => {
          const result = await d.getExternalMaintainers();
          expect(result).toEqual([]);
        }
      );
    });
  });
});