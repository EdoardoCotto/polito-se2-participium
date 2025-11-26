"use strict";

// Mock esplicito di sqlite3 con Database e metodi get/run/all tracciabili
jest.mock('sqlite3', () => {
  const mockGet = jest.fn();
  const mockRun = jest.fn();
  const mockAll = jest.fn();
  function Database(dbPath, cb) {
    if (cb) cb(null); // nessun errore di connessione
    this.get = mockGet;
    this.run = mockRun;
    this.all = mockAll;
  }
  Database.mockGet = mockGet;
  Database.mockRun = mockRun;
  Database.mockAll = mockAll;
  return { Database };
});

// Mock di bcrypt (async e callback usage)
const mockCompare = jest.fn();
const mockGenSalt = jest.fn();
const mockHash = jest.fn();
jest.mock('bcrypt', () => ({
  compare: mockCompare,
  genSalt: mockGenSalt,
  hash: mockHash
}));

const dao = require('../../server/dao/userDao');
const sqlite3Instance = require('sqlite3');
const mockGet = sqlite3Instance.Database.mockGet;
const mockRun = sqlite3Instance.Database.mockRun;
const mockAll = sqlite3Instance.Database.mockAll;

describe('userDao Functions', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReset();
    mockRun.mockReset();
    mockAll.mockReset();
    mockCompare.mockReset();
    mockGenSalt.mockReset();
    mockHash.mockReset();
    // valori di default
    mockGenSalt.mockResolvedValue('mock_salt');
    mockHash.mockResolvedValue('mock_hash');
  });

  describe('getUser', () => {
    test('should return user when credentials are correct', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        name: 'John',
        surname: 'Doe',
        type: 'citizen',
        password: 'hashed_password'
      };

      mockGet.mockImplementation((sql, params, callback) => {
        callback(null, mockUser);
      });

      mockCompare.mockImplementation((password, hash, callback) => {
        callback(null, true);
      });

      const result = await dao.getUser('testuser', 'password123');

      expect(result).toEqual({
        id: 1,
        username: 'testuser',
        name: 'John',
        surname: 'Doe',
        type: 'citizen'
      });
      expect(mockGet).toHaveBeenCalled();
      expect(mockCompare).toHaveBeenCalledWith('password123', 'hashed_password', expect.any(Function));
    });

    test('should return false when user not found', async () => {
      mockGet.mockImplementation((sql, params, callback) => {
        callback(null, undefined);
      });

      const result = await dao.getUser('nonexistent', 'password');

      expect(result).toBe(false);
      expect(mockCompare).not.toHaveBeenCalled();
    });

    test('should return false when password is incorrect', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashed_password'
      };

      mockGet.mockImplementation((sql, params, callback) => {
        callback(null, mockUser);
      });

      mockCompare.mockImplementation((password, hash, callback) => {
        callback(null, false);
      });

      const result = await dao.getUser('testuser', 'wrongpassword');

      expect(result).toBe(false);
    });

    test('should reject on database error', async () => {
      mockGet.mockImplementation((sql, params, callback) => {
        callback(new Error('DB Error'));
      });

      await expect(dao.getUser('testuser', 'password')).rejects.toThrow('DB Error');
    });

    test('should reject on bcrypt error', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashed_password'
      };

      mockGet.mockImplementation((sql, params, callback) => {
        callback(null, mockUser);
      });

      mockCompare.mockImplementation((password, hash, callback) => {
        callback(new Error('Bcrypt Error'));
      });

      await expect(dao.getUser('testuser', 'password')).rejects.toThrow('Bcrypt Error');
    });
  });

  describe('getUserById', () => {
    test('should return user by id', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        name: 'John',
        surname: 'Doe',
        type: 'citizen'
      };

      mockGet.mockImplementation((sql, params, callback) => {
        callback(null, mockUser);
      });

      const result = await dao.getUserById(1);

      expect(result).toEqual(mockUser);
      expect(mockGet).toHaveBeenCalled();
    });

    test('should return undefined when user not found', async () => {
      mockGet.mockImplementation((sql, params, callback) => {
        callback(null, undefined);
      });

      const result = await dao.getUserById(999);

      expect(result).toBeUndefined();
    });

    test('should reject on database error', async () => {
      mockGet.mockImplementation((sql, params, callback) => {
        callback(new Error('DB Error'));
      });

      await expect(dao.getUserById(1)).rejects.toThrow('DB Error');
    });
  });

  describe('getUserByUsername', () => {
    test('should return user by username', async () => {
      const mockUser = { id: 1 };

      mockGet.mockImplementation((sql, params, callback) => {
        callback(null, mockUser);
      });

      const result = await dao.getUserByUsername('testuser');

      expect(result).toEqual(mockUser);
      expect(mockGet).toHaveBeenCalled();
    });

    test('should return undefined when user not found', async () => {
      mockGet.mockImplementation((sql, params, callback) => {
        callback(null, undefined);
      });

      const result = await dao.getUserByUsername('nonexistent');

      expect(result).toBeUndefined();
    });

    test('should reject on database error', async () => {
      mockGet.mockImplementation((sql, params, callback) => {
        callback(new Error('DB Error'));
      });

      await expect(dao.getUserByUsername('testuser')).rejects.toThrow('DB Error');
    });
  });

  describe('getUserByEmail', () => {
    test('should return user by email', async () => {
      const mockUser = { id: 1 };

      mockGet.mockImplementation((sql, params, callback) => {
        callback(null, mockUser);
      });

      const result = await dao.getUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockGet).toHaveBeenCalled();
    });

    test('should return undefined when user not found', async () => {
      mockGet.mockImplementation((sql, params, callback) => {
        callback(null, undefined);
      });

      const result = await dao.getUserByEmail('nonexistent@example.com');

      expect(result).toBeUndefined();
    });

    test('should reject on database error', async () => {
      mockGet.mockImplementation((sql, params, callback) => {
        callback(new Error('DB Error'));
      });

      await expect(dao.getUserByEmail('test@example.com')).rejects.toThrow('DB Error');
    });
  });

  describe('createUser', () => {
    test('should create new user successfully', async () => {
      const newUser = {
        username: 'newuser',
        email: 'new@example.com',
        name: 'Jane',
        surname: 'Smith',
        password: 'password123',
        type: 'citizen'
      };

      mockRun.mockImplementation(function(sql, params, callback) {
        callback.call({ lastID: 42 }, null);
      });

      const result = await dao.createUser(newUser);

      expect(mockGenSalt).toHaveBeenCalledWith(10);
      expect(mockHash).toHaveBeenCalledWith('password123', 'mock_salt');
      expect(mockRun).toHaveBeenCalled();
      expect(result).toEqual({
        id: 42,
        username: 'newuser',
        email: 'new@example.com',
        name: 'Jane',
        surname: 'Smith',
        type: 'citizen'
      });
    });

    test('should use default type citizen when not specified', async () => {
      const newUser = {
        username: 'newuser',
        email: 'new@example.com',
        name: 'Jane',
        surname: 'Smith',
        password: 'password123'
      };

      mockRun.mockImplementation(function(sql, params, callback) {
        callback.call({ lastID: 43 }, null);
      });

      const result = await dao.createUser(newUser);

      expect(result.type).toBe('citizen');
    });

    test('should reject on database error', async () => {
      const newUser = {
        username: 'newuser',
        email: 'new@example.com',
        name: 'Jane',
        surname: 'Smith',
        password: 'password123'
      };

      mockRun.mockImplementation((sql, params, callback) => {
        callback(new Error('DB Error'));
      });

      await expect(dao.createUser(newUser)).rejects.toThrow('DB Error');
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
      mockRun.mockImplementation(function(sql, params, callback) {
        callback.call({ changes: 1 }, null);
      });

      const result = await dao.updateUserTypeById(1, 'municipal_public_relations_officer');

      expect(mockRun).toHaveBeenCalled();
      expect(result).toEqual({
        id: 1,
        type: 'municipal_public_relations_officer'
      });
    });

    test('should return null when no row updated', async () => {
      mockRun.mockImplementation(function(sql, params, callback) {
        callback.call({ changes: 0 }, null);
      });

      const result = await dao.updateUserTypeById(999, 'municipal_public_relations_officer');

      expect(result).toBeNull();
    });

    test('should reject invalid role', async () => {
      await expect(dao.updateUserTypeById(1, 'invalid_role')).rejects.toThrow('Invalid role');
      expect(mockRun).not.toHaveBeenCalled();
    });

    test('should reject on database error', async () => {
      mockRun.mockImplementation((sql, params, callback) => {
        callback(new Error('DB Error'));
      });

      await expect(dao.updateUserTypeById(1, 'municipal_public_relations_officer')).rejects.toThrow('DB Error');
    });
  });

  describe('findMunicipalityUsers', () => {
    test('should return municipality users', async () => {
      const mockUsers = [
        {
          id: 1,
          username: 'officer1',
          email: 'officer1@example.com',
          name: 'John',
          surname: 'Doe',
          type: 'municipal_public_relations_officer'
        }
      ];

      mockAll.mockImplementation((sql, params, callback) => {
        callback(null, mockUsers);
      });

      const result = await dao.findMunicipalityUsers();

      expect(mockAll).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });

    test('should return empty array when no users found', async () => {
      mockAll.mockImplementation((sql, params, callback) => {
        callback(null, []);
      });

      const result = await dao.findMunicipalityUsers();

      expect(result).toEqual([]);
    });

    test('should return empty array when undefined', async () => {
      mockAll.mockImplementation((sql, params, callback) => {
        callback(null, undefined);
      });

      const result = await dao.findMunicipalityUsers();

      expect(result).toEqual([]);
    });

    test('should reject on database error', async () => {
      mockAll.mockImplementation((sql, params, callback) => {
        callback(new Error('DB Error'));
      });

      await expect(dao.findMunicipalityUsers()).rejects.toThrow('DB Error');
    });
  });

  describe('updateUserProfile', () => {
    test('rejects when select query errors', async () => {
      mockGet.mockImplementation((sql, params, cb) => cb(new Error('Select Error')));
      await expect(dao.updateUserProfile(1, {})).rejects.toThrow('Select Error');
    });

    test('rejects when user not found', async () => {
      mockGet.mockImplementation((sql, params, cb) => cb(null, undefined));
      await expect(dao.updateUserProfile(2, {})).rejects.toThrow('User not found');
    });

    test('resolves with id only when no fields provided', async () => {
      mockGet.mockImplementation((sql, params, cb) => cb(null, { telegram_nickname: 't', personal_photo_path: 'p.png', mail_notifications: 1 }));
      mockRun.mockImplementation((sql, params, cb) => cb(null));
      const res = await dao.updateUserProfile(3, {});
      expect(res).toEqual({ id: 3 });
      expect(mockRun).not.toHaveBeenCalled();
    });

    test('skips null-to-null updates and returns id only', async () => {
      mockGet.mockImplementation((sql, params, cb) => cb(null, { telegram_nickname: null, personal_photo_path: null, mail_notifications: null }));
      mockRun.mockImplementation((sql, params, cb) => cb(null));
      const res = await dao.updateUserProfile(4, { telegram_nickname: null });
      expect(res).toEqual({ id: 4 });
      expect(mockRun).not.toHaveBeenCalled();
    });

    test('updates all fields and returns updated values', async () => {
      const current = { telegram_nickname: 'oldNick', personal_photo_path: 'old.png', mail_notifications: 0 };
      const updates = { telegram_nickname: 'newNick', personal_photo_path: 'new.png', mail_notifications: 1 };
      mockGet.mockImplementation((sql, params, cb) => cb(null, current));
      mockRun.mockImplementation((sql, params, cb) => cb(null));
      const result = await dao.updateUserProfile(5, updates);
      expect(mockRun).toHaveBeenCalled();
      const [sql, params] = mockRun.mock.calls[0];
      expect(sql).toMatch(/^UPDATE Users SET /);
      expect(sql).toContain('telegram_nickname = ?');
      expect(sql).toContain('personal_photo_path = ?');
      expect(sql).toContain('mail_notifications = ?');
      expect(sql).toContain('updated_at = CURRENT_TIMESTAMP');
      expect(params.slice(0, 3)).toEqual(['newNick', 'new.png', 1]);
      expect(params[3]).toBe(5);
      expect(result).toEqual({ id: 5, telegram_nickname: 'newNick', personal_photo_path: 'new.png', mail_notifications: 1 });
    });

    test('partial updates including setting null from non-null', async () => {
      const current = { telegram_nickname: null, personal_photo_path: 'has.png', mail_notifications: 1 };
      const updates = { telegram_nickname: 'nick', personal_photo_path: null };
      mockGet.mockImplementation((sql, params, cb) => cb(null, current));
      mockRun.mockImplementation((sql, params, cb) => cb(null));
      const result = await dao.updateUserProfile(6, updates);
      expect(mockRun).toHaveBeenCalled();
      const [sql, params] = mockRun.mock.calls[0];
      expect(sql).toContain('telegram_nickname = ?');
      expect(sql).toContain('personal_photo_path = ?');
      expect(sql).not.toContain('mail_notifications = ?');
      expect(params).toEqual(['nick', null, 6]);
      expect(result).toEqual({ id: 6, telegram_nickname: 'nick', personal_photo_path: null });
    });

    test('rejects when update run errors', async () => {
      const current = { telegram_nickname: 'x', personal_photo_path: 'y', mail_notifications: 0 };
      mockGet.mockImplementation((sql, params, cb) => cb(null, current));
      mockRun.mockImplementation((sql, params, cb) => cb(new Error('Update Error')));
      await expect(dao.updateUserProfile(7, { telegram_nickname: 'z' })).rejects.toThrow('Update Error');
    });
  });
});