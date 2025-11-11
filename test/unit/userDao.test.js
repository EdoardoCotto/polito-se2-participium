const bcrypt = require('bcrypt');

// Mock the sqlite database instance completely
jest.mock('sqlite3', () => {
  const mockDb = {
    get: jest.fn(),
    run: jest.fn(),
    all: jest.fn(),
  };
  const mockConstructor = jest.fn(() => mockDb);
  return { Database: mockConstructor, __mockDb: mockDb };
});

const { Database, __mockDb: db } = require('sqlite3');


Database.mockImplementation((path, cb) => {
  if (cb) cb(null);
  return db;
});

const userDao = require('../../server/dao/userDao');


describe('userDao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- getUser ---------------------------------------------------
  describe('getUser', () => {
    it('should resolve false if user not found', async () => {
      db.get.mockImplementation((sql, params, cb) => cb(null, undefined));
      const result = await userDao.getUser('fakeUser', 'pass');
      expect(result).toBe(false);
    });

    it('should reject if db.get returns an error', async () => {
      db.get.mockImplementation((sql, params, cb) => cb(new Error('DB fail')));
      await expect(userDao.getUser('user', 'pass')).rejects.toThrow('DB fail');
    });

    it('should resolve false if password does not match', async () => {
      db.get.mockImplementation((sql, params, cb) => cb(null, { password: 'hashed' }));
      jest.spyOn(bcrypt, 'compare').mockImplementation((pw, hash, cb) => cb(null, false));
      const result = await userDao.getUser('user', 'wrong');
      expect(result).toBe(false);
    });

    it('should reject if bcrypt.compare throws error', async () => {
      db.get.mockImplementation((sql, params, cb) => cb(null, { password: 'x' }));
      jest.spyOn(bcrypt, 'compare').mockImplementation((pw, hash, cb) => cb(new Error('bcrypt error')));
      await expect(userDao.getUser('u', 'p')).rejects.toThrow('bcrypt error');
    });

    it('should resolve user object if credentials are valid', async () => {
      const mockRow = { id: 1, username: 'u', name: 'n', surname: 's', type: 'citizen', password: 'hash' };
      db.get.mockImplementation((sql, params, cb) => cb(null, mockRow));
      jest.spyOn(bcrypt, 'compare').mockImplementation((pw, hash, cb) => cb(null, true));
      const result = await userDao.getUser('u', 'p');
      expect(result).toMatchObject({
        id: 1,
        username: 'u',
        name: 'n',
        surname: 's',
        type: 'citizen',
      });
    });
  });

  // --- getUserById ----------------------------------------------
  describe('getUserById', () => {
    it('should resolve user row', async () => {
      const mockRow = { id: 1, username: 'a' };
      db.get.mockImplementation((sql, params, cb) => cb(null, mockRow));
      const result = await userDao.getUserById(1);
      expect(result).toEqual(mockRow);
    });

    it('should reject if db.get fails', async () => {
      db.get.mockImplementation((sql, params, cb) => cb(new Error('boom')));
      await expect(userDao.getUserById(1)).rejects.toThrow('boom');
    });
  });

  // --- getUserByUsername -----------------------------------------
  describe('getUserByUsername', () => {
    it('should resolve row if found', async () => {
      const mockRow = { id: 10 };
      db.get.mockImplementation((sql, params, cb) => cb(null, mockRow));
      const result = await userDao.getUserByUsername('u');
      expect(result).toEqual(mockRow);
    });

    it('should reject if db.get throws', async () => {
      db.get.mockImplementation((sql, params, cb) => cb(new Error('err')));
      await expect(userDao.getUserByUsername('u')).rejects.toThrow('err');
    });
  });

  // --- getUserByEmail --------------------------------------------
  describe('getUserByEmail', () => {
    it('should resolve row if found', async () => {
      const mockRow = { id: 5 };
      db.get.mockImplementation((sql, params, cb) => cb(null, mockRow));
      const result = await userDao.getUserByEmail('mail');
      expect(result).toEqual(mockRow);
    });

    it('should reject if db.get throws', async () => {
      db.get.mockImplementation((sql, params, cb) => cb(new Error('err')));
      await expect(userDao.getUserByEmail('x')).rejects.toThrow('err');
    });
  });

  // --- createUser ------------------------------------------------
  describe('createUser', () => {
    it('should insert user and resolve object', async () => {
      jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt');
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed');
      db.run.mockImplementation(function (sql, params, cb) {
        this.lastID = 123;
        cb.call(this, null);
      });

      const user = await userDao.createUser({
        username: 'u',
        email: 'e',
        name: 'n',
        surname: 's',
        password: 'p',
      });

      expect(user).toEqual({
        id: 123,
        username: 'u',
        email: 'e',
        name: 'n',
        surname: 's',
        type: 'citizen',
      });
    });

    it('should reject if db.run fails', async () => {
      jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt');
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed');
      db.run.mockImplementation(function (sql, params, cb) {
        cb(new Error('insert fail'));
      });
      await expect(
        userDao.createUser({ username: 'a', email: 'b', name: 'c', surname: 'd', password: 'p' })
      ).rejects.toThrow('insert fail');
    });

    it('should reject if bcrypt throws', async () => {
      jest.spyOn(bcrypt, 'genSalt').mockRejectedValue(new Error('bcrypt fail'));
      await expect(
        userDao.createUser({ username: 'a', email: 'b', name: 'c', surname: 'd', password: 'p' })
      ).rejects.toThrow('bcrypt fail');
    });
  });

  // --- updateUserTypeById ---------------------------------------
  describe('updateUserTypeById', () => {
    it('should reject if newType not allowed', async () => {
      await expect(userDao.updateUserTypeById(1, 'invalid')).rejects.toThrow('Invalid role');
    });

    it('should reject if db.run fails', async () => {
      db.run.mockImplementation((sql, params, cb) => cb(new Error('fail')));
      await expect(userDao.updateUserTypeById(1, 'citizen')).rejects.toThrow('fail');
    });

    it('should resolve null if no rows updated', async () => {
      db.run.mockImplementation(function (sql, params, cb) {
        this.changes = 0;
        cb.call(this, null);
      });
      const result = await userDao.updateUserTypeById(1, 'citizen');
      expect(result).toBeNull();
    });

    it('should resolve updated object if successful', async () => {
      db.run.mockImplementation(function (sql, params, cb) {
        this.changes = 1;
        cb.call(this, null);
      });
      const result = await userDao.updateUserTypeById(42, 'citizen');
      expect(result).toEqual({ id: 42, type: 'citizen' });
    });
  });

  // --- findMunicipalityUsers ------------------------------------
  describe('findMunicipalityUsers', () => {
    it('should resolve rows array', async () => {
      const mockRows = [{ id: 1, type: 'operator' }];
      db.all.mockImplementation((sql, params, cb) => cb(null, mockRows));
      const result = await userDao.findMunicipalityUsers();
      expect(result).toEqual(mockRows);
    });

    it('should reject if db.all fails', async () => {
      db.all.mockImplementation((sql, params, cb) => cb(new Error('boom')));
      await expect(userDao.findMunicipalityUsers()).rejects.toThrow('boom');
    });

    it('should resolve empty array if no rows', async () => {
      db.all.mockImplementation((sql, params, cb) => cb(null, undefined));
      const result = await userDao.findMunicipalityUsers();
      expect(result).toEqual([]);
    });
  });
});
