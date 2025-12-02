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
    const getSqlite3Module = () => {
      // eslint-disable-next-line global-require
      return require('sqlite3');
    };

    const defaultGetImpl = (_sql, _params, cb2) => cb2(null, undefined);
    const defaultRunImpl = (_sql, _params, cb2) => cb2(null);
    const defaultAllImpl = (_sql, _params, cb2) => cb2(null, []);

    const createMockDatabase = (getImpl, runImpl, allImpl) => {
      return function (_p, cb) {
        if (cb) cb(null);
        this.get = getImpl || defaultGetImpl;
        this.run = runImpl || defaultRunImpl;
        this.all = allImpl || defaultAllImpl;
        return this;
      };
    };

    const loadDaoInIsolatedModule = () => {
      let localDao;
      jest.isolateModules(() => {
        // eslint-disable-next-line global-require
        localDao = require('../../server/dao/userDao');
      });
      return localDao;
    };

    const withSqliteMock = async (impls, fn) => {
      jest.resetModules();
      const { getImpl, runImpl, allImpl } = impls;
      const sqlite3 = getSqlite3Module();
      const mockDbConstructor = createMockDatabase(getImpl, runImpl, allImpl);
      const ctorSpy = jest.spyOn(sqlite3, 'Database').mockImplementation(mockDbConstructor);
      
      const localDao = loadDaoInIsolatedModule();
      
      try {
        await fn(localDao);
      } finally {
        ctorSpy.mockRestore();
        jest.resetModules();
      }
    };

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
});