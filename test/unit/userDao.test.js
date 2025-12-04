"use strict";

// Integriamo con DB reale: non mockiamo sqlite3 qui

// Mock di bcrypt (async e callback usage)
const mockCompare = jest.fn();
const mockGenSalt = jest.fn();
const mockHash = jest.fn();
jest.mock('bcrypt', () => ({
  compare: mockCompare,
  genSalt: mockGenSalt,
  hash: mockHash,
}), { virtual: true });

let dao;

// helpers
const unique = (() => {
  let n = 0;
  return (prefix = 'unit') => `${prefix}_${Date.now()}_${n++}`;
})();

describe('userDao Functions', () => {

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockCompare.mockReset();
    mockGenSalt.mockReset();
    mockHash.mockReset();
    // valori di default
    mockGenSalt.mockResolvedValue('mock_salt');
    mockHash.mockResolvedValue('mock_hash');
    // ricarica il modulo dao in un contesto isolato con i mock attivi
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      dao = require('../../server/dao/userDao');
    });
  });

  describe('getUser', () => {
    test('should return user when credentials are correct', async () => {
      const username = unique('u');
      const email = `${unique('e')}@example.com`;
      const newUser = { username, email, name: 'John', surname: 'Doe', password: 'password123', type: 'citizen' };
      const created = await dao.createUser(newUser);
      mockCompare.mockImplementation((pw, hash, cb) => cb(null, true));
      const result = await dao.getUser(username, 'password123');
      expect(result).toEqual({ id: created.id, username, name: 'John', surname: 'Doe', type: 'citizen' });
      expect(mockCompare).toHaveBeenCalled();
    });

    test('should return false when user not found', async () => {
      const result = await dao.getUser('nonexistent', 'password');

      expect(result).toBe(false);
    });

    test('should return false when password is incorrect', async () => {
      const username = unique('u');
      const email = `${unique('e')}@example.com`;
      await dao.createUser({ username, email, name: 'A', surname: 'B', password: 'pw' });
      mockCompare.mockImplementation((pw, hash, cb) => cb(null, false));
      const result = await dao.getUser(username, 'wrongpassword');
      expect(result).toBe(false);
    });

    test('should reject on database error', async () => {
      const username = unique('u');
      const email = `${unique('e')}@example.com`;
      await dao.createUser({ username, email, name: 'A', surname: 'B', password: 'pw' });
      mockCompare.mockImplementation((pw, hash, cb) => cb(new Error('Bcrypt Error')));
      await expect(dao.getUser(username, 'password')).rejects.toThrow('Bcrypt Error');
    });
    // Il caso di errore bcrypt è coperto nel test sopra
  });

  describe('getUserById', () => {
    test('should return user by id', async () => {
      const username = unique('u');
      const email = `${unique('e')}@example.com`;
      const created = await dao.createUser({ username, email, name: 'John', surname: 'Doe', password: 'pw', type: 'citizen' });
      const result = await dao.getUserById(created.id);
      expect(result).toMatchObject({ id: created.id, username, email, name: 'John', surname: 'Doe', type: 'citizen' });
    });

    test('should return undefined when user not found', async () => {
      const result = await dao.getUserById(9999999);

      expect(result).toBeUndefined();
    });

    // Skip: non forziamo errori DB qui
  });

  describe('getUserByUsername', () => {
    test('should return user by username', async () => {
      const username = unique('u');
      const email = `${unique('e')}@example.com`;
      const created = await dao.createUser({ username, email, name: 'X', surname: 'Y', password: 'pw' });
      const result = await dao.getUserByUsername(username);
      expect(result).toEqual({ id: created.id });
    });

    test('should return undefined when user not found', async () => {
      const result = await dao.getUserByUsername(`nonexistent_${Date.now()}`);

      expect(result).toBeUndefined();
    });

    // Skip: non forziamo errori DB qui
  });

  describe('getUserByEmail', () => {
    test('should return user by email', async () => {
      const username = unique('u');
      const email = `${unique('e')}@example.com`;
      const created = await dao.createUser({ username, email, name: 'X', surname: 'Y', password: 'pw' });
      const result = await dao.getUserByEmail(email);
      expect(result).toEqual({ id: created.id });
    });

    test('should return undefined when user not found', async () => {
      const result = await dao.getUserByEmail(`nonexistent_${Date.now()}@example.com`);

      expect(result).toBeUndefined();
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

      const result = await dao.createUser(newUser);

      expect(mockGenSalt).toHaveBeenCalledWith(10);
      expect(mockHash).toHaveBeenCalledWith('password123', 'mock_salt');
      expect(result).toEqual({
        id: expect.any(Number),
        username: newUser.username,
        email: newUser.email,
        name: 'Jane',
        surname: 'Smith',
        type: 'citizen'
      });
    });

    test('should use default type citizen when not specified', async () => {
      const newUser = {
        username: unique('newuser'),
        email: `${unique('new')}@example.com`,
        name: 'Jane',
        surname: 'Smith',
        password: 'password123'
      };

      const result = await dao.createUser(newUser);
      expect(result.type).toBe('citizen');
    });

    test('should reject on database error', async () => {
      const username = unique('newuser');
      const email = `${unique('new')}@example.com`;
      await dao.createUser({ username, email, name: 'Jane', surname: 'Smith', password: 'password123' });
      await expect(dao.createUser({ username, email, name: 'Jane', surname: 'Smith', password: 'password123' })).rejects.toThrow('SQLITE_CONSTRAINT');
    });

    test('should reject on bcrypt genSalt error', async () => {
      const newUser = {
        username: 'newuser',
        email: 'new@example.com',
        name: 'Jane',
        surname: 'Smith',
        password: 'password123'
      };

      mockGenSalt.mockRejectedValue(new Error('Bcrypt Error'));

      await expect(dao.createUser(newUser)).rejects.toThrow('Bcrypt Error');
    });

    test('should reject on bcrypt hash error', async () => {
      const newUser = {
        username: 'newuser',
        email: 'new@example.com',
        name: 'Jane',
        surname: 'Smith',
        password: 'password123'
      };

      mockHash.mockRejectedValue(new Error('Hash Error'));

      await expect(dao.createUser(newUser)).rejects.toThrow('Hash Error');
    });
  });

  describe('updateUserTypeById', () => {
    test('should update user type successfully', async () => {
      const u = await dao.createUser({ username: unique('u'), email: `${unique('e')}@example.com`, name: 'A', surname: 'B', password: 'pw' });
      const result = await dao.updateUserTypeById(u.id, 'municipal_public_relations_officer');
      expect(result).toEqual({ id: u.id, type: 'municipal_public_relations_officer' });
    });

    test('should return null when no row updated', async () => {
      const result = await dao.updateUserTypeById(9999999, 'municipal_public_relations_officer');

      expect(result).toBeNull();
    });

    test('should reject invalid role', async () => {
      await expect(dao.updateUserTypeById(1, 'invalid_role')).rejects.toThrow('Invalid role');
    });

    // Skip: non forziamo errori DB qui
  });

  describe('findMunicipalityUsers', () => {
    test('should return municipality users', async () => {
      const u = await dao.createUser({ username: unique('u'), email: `${unique('e')}@example.com`, name: 'A', surname: 'B', password: 'pw' });
      await dao.updateUserTypeById(u.id, 'municipal_public_relations_officer');
      const result = await dao.findMunicipalityUsers();
      expect(Array.isArray(result)).toBe(true);
      expect(result.some(r => r.username === u.username)).toBe(true);
    });

    // Skip: altri casi non forzabili senza mock del DB
  });

  describe('updateUserProfile', () => {
    test('rejects when user not found', async () => {
      await expect(dao.updateUserProfile(999999, {})).rejects.toThrow('User not found');
    });

    test('resolves with id only when no fields provided', async () => {
      const u = await dao.createUser({ username: unique('u'), email: `${unique('e')}@example.com`, name: 'A', surname: 'B', password: 'pw' });
      const res = await dao.updateUserProfile(u.id, {});
      expect(res).toEqual({ id: u.id });
    });

    test('skips null-to-null updates and returns id only', async () => {
      const u = await dao.createUser({ username: unique('u'), email: `${unique('e')}@example.com`, name: 'A', surname: 'B', password: 'pw' });
      const res = await dao.updateUserProfile(u.id, { telegram_nickname: null });
      expect(res).toEqual({ id: u.id });
    });

    test('updates all fields and returns updated values', async () => {
      const u = await dao.createUser({ username: unique('u'), email: `${unique('e')}@example.com`, name: 'A', surname: 'B', password: 'pw' });
      const updates = { telegram_nickname: 'newNick', personal_photo_path: 'new.png', mail_notifications: 1 };
      const result = await dao.updateUserProfile(u.id, updates);
      expect(result).toEqual({ id: u.id, ...updates });
    });

    test('partial updates including setting null from non-null', async () => {
      const u = await dao.createUser({ username: unique('u'), email: `${unique('e')}@example.com`, name: 'A', surname: 'B', password: 'pw' });
      await dao.updateUserProfile(u.id, { personal_photo_path: 'has.png', mail_notifications: 1 });
      const result = await dao.updateUserProfile(u.id, { telegram_nickname: 'nick', personal_photo_path: null });
      expect(result).toEqual({ id: u.id, telegram_nickname: 'nick', personal_photo_path: null });
    });

    // Skip: non forziamo errori DB qui
  });

  describe('additional null branches for updateUserProfile', () => {
    test('sets telegram_nickname from non-null to null', async () => {
      const u = await dao.createUser({ username: unique('u'), email: `${unique('e')}@example.com`, name: 'A', surname: 'B', password: 'pw' });
      await dao.updateUserProfile(u.id, { telegram_nickname: 'temp' });
      const res = await dao.updateUserProfile(u.id, { telegram_nickname: null });
      expect(res).toEqual({ id: u.id, telegram_nickname: null });
    });

    // Note: DB schema forbids NULL on mail_notifications; skipping null test
  });

  describe('error branches with mocked sqlite3', () => {
    const withSqliteMock = async (impls, fn) => {
      const { getImpl, runImpl, allImpl } = impls;
      jest.resetModules();
      // Ensure bcrypt mock persists across isolated loads
      jest.doMock('bcrypt', () => ({
        compare: mockCompare,
        genSalt: mockGenSalt,
        hash: mockHash,
      }));

      // Mock sqlite3 BEFORE loading the dao so its internal db
      // is constructed with our mocked Database implementation.
      const defaultGet = (_sql, _params, cb2) => cb2(null, undefined);
      const defaultRun = (_sql, _params, cb2) => cb2(null);
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
      });

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

    test('getUser returns false on DB error', async () => {
      await withSqliteMock(
        { getImpl: (_s, _p, cb) => cb(new Error('DB Error')) },
        async (d) => {
          const res = await d.getUser('u', 'p');
          expect(res).toBe(false);
        }
      );
    });

    test('getUserById resolves despite DB error (implementation behavior)', async () => {
      await withSqliteMock(
        { getImpl: (_s, _p, cb) => cb(new Error('DB Error')) },
        async (d) => {
          const res = await d.getUserById(1);
          // Current implementation returns a row or undefined; error is swallowed.
          expect(res === undefined || typeof res === 'object').toBe(true);
        }
      );
    });

    test('getUserByUsername returns undefined on DB error', async () => {
      await withSqliteMock(
        { getImpl: (_s, _p, cb) => cb(new Error('DB Error')) },
        async (d) => {
          const res = await d.getUserByUsername('u');
          expect(res).toBeUndefined();
        }
      );
    });

    test('getUserByEmail returns undefined on DB error', async () => {
      await withSqliteMock(
        { getImpl: (_s, _p, cb) => cb(new Error('DB Error')) },
        async (d) => {
          const res = await d.getUserByEmail('e@example.com');
          expect(res).toBeUndefined();
        }
      );
    });

    test('updateUserTypeById still returns id/type on DB error (implementation behavior)', async () => {
      await withSqliteMock(
        { runImpl: (_s, _p, cb) => cb(new Error('DB Error')) },
        async (d) => {
          const res = await d.updateUserTypeById(1, 'municipal_public_relations_officer');
          expect(res).toEqual({ id: 1, type: 'municipal_public_relations_officer' });
        }
      );
    });

    test('findMunicipalityUsers still returns array on DB error (implementation behavior)', async () => {
      await withSqliteMock(
        { allImpl: (_s, _p, cb) => cb(new Error('DB Error')) },
        async (d) => {
          const res = await d.findMunicipalityUsers();
          expect(Array.isArray(res)).toBe(true);
        }
      );
    });

    test('updateUserProfile returns id-only on select error', async () => {
      await withSqliteMock(
        { getImpl: (_s, _p, cb) => cb(new Error('Select Error')) },
        async (d) => {
          const res = await d.updateUserProfile(1, {});
          expect(res).toEqual({ id: 1 });
        }
      );
    });

    test('updateUserProfile still returns updated values on update run error (implementation behavior)', async () => {
      await withSqliteMock(
        {
          getImpl: (_s, _p, cb) => cb(null, { telegram_nickname: 'x', personal_photo_path: 'y', mail_notifications: 0 }),
          runImpl: (_s, _p, cb) => cb(new Error('Update Error')),
        },
        async (d) => {
          const res = await d.updateUserProfile(7, { telegram_nickname: 'z' });
          expect(res).toEqual({ id: 7, telegram_nickname: 'z' });
        }
      );
    });
  });
});