"use strict";

const bcrypt = require("bcrypt");

// Mocks for sqlite3
const dbRunMock = jest.fn();
const dbGetMock = jest.fn();
const dbAllMock = jest.fn();

jest.mock("sqlite3", () => {
  const mDb = function () {
    return { run: dbRunMock, get: dbGetMock, all: dbAllMock };
  };
  return { Database: mDb };
});

const userDao = require("../../server/dao/userDao");
const { ALLOWED_ROLES } = require("../../server/constants/roles");

describe("userDao", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUser", () => {
    it("rejects on DB error", async () => {
      dbGetMock.mockImplementation((sql, params, cb) => cb(new Error("DB fail")));
      await expect(userDao.getUser("a", "b")).rejects.toThrow("DB fail");
    });

    it("resolves false when user not found", async () => {
      dbGetMock.mockImplementation((sql, params, cb) => cb(null, undefined));
      const res = await userDao.getUser("a", "b");
      expect(res).toBe(false);
    });

    it("rejects when bcrypt.compare throws", async () => {
      dbGetMock.mockImplementation((sql, params, cb) =>
        cb(null, { id: 1, username: "x", password: "hashed" })
      );
      bcrypt.compare = jest.fn((pw, hash, cb) => cb(new Error("compare fail")));
      await expect(userDao.getUser("a", "b")).rejects.toThrow("compare fail");
    });

    it("resolves false when password mismatch", async () => {
      dbGetMock.mockImplementation((sql, params, cb) =>
        cb(null, { id: 1, username: "x", password: "hashed" })
      );
      bcrypt.compare = jest.fn((pw, hash, cb) => cb(null, false));
      const res = await userDao.getUser("a", "b");
      expect(res).toBe(false);
    });

    it("resolves user when password matches", async () => {
      const row = {
        id: 1,
        username: "john",
        name: "John",
        surname: "Doe",
        type: "citizen",
        password: "hashed",
      };
      dbGetMock.mockImplementation((sql, params, cb) => cb(null, row));
      bcrypt.compare = jest.fn((pw, hash, cb) => cb(null, true));

      const res = await userDao.getUser("john", "pw");
      expect(res).toEqual({
        id: 1,
        username: "john",
        name: "John",
        surname: "Doe",
        type: "citizen",
      });
    });
  });

  describe("getUserById", () => {
    it("rejects on DB error", async () => {
      dbGetMock.mockImplementation((sql, params, cb) => cb(new Error("DB err")));
      await expect(userDao.getUserById(1)).rejects.toThrow("DB err");
    });

    it("resolves with user row", async () => {
      const row = { id: 1, username: "x" };
      dbGetMock.mockImplementation((sql, params, cb) => cb(null, row));
      const res = await userDao.getUserById(1);
      expect(res).toEqual(row);
    });
  });

  describe("getUserByUsername", () => {
    it("rejects on DB error", async () => {
      dbGetMock.mockImplementation((sql, params, cb) => cb(new Error("fail")));
      await expect(userDao.getUserByUsername("a")).rejects.toThrow("fail");
    });

    it("resolves with row", async () => {
      const row = { id: 99 };
      dbGetMock.mockImplementation((sql, params, cb) => cb(null, row));
      const res = await userDao.getUserByUsername("a");
      expect(res).toEqual(row);
    });
  });

  describe("getUserByEmail", () => {
    it("rejects on DB error", async () => {
      dbGetMock.mockImplementation((sql, params, cb) => cb(new Error("fail")));
      await expect(userDao.getUserByEmail("a@b.c")).rejects.toThrow("fail");
    });

    it("resolves with row", async () => {
      const row = { id: 7 };
      dbGetMock.mockImplementation((sql, params, cb) => cb(null, row));
      const res = await userDao.getUserByEmail("a@b.c");
      expect(res).toEqual(row);
    });
  });

  describe("createUser", () => {
    it("rejects on genSalt error", async () => {
      bcrypt.genSalt = jest.fn().mockRejectedValue(new Error("salt fail"));
      await expect(
        userDao.createUser({ username: "a", email: "e", name: "n", surname: "s", password: "p" })
      ).rejects.toThrow("salt fail");
    });

    it("rejects on hash error", async () => {
      bcrypt.genSalt = jest.fn().mockResolvedValue("salt");
      bcrypt.hash = jest.fn().mockRejectedValue(new Error("hash fail"));
      await expect(
        userDao.createUser({ username: "a", email: "e", name: "n", surname: "s", password: "p" })
      ).rejects.toThrow("hash fail");
    });

    it("rejects on db.run error", async () => {
      bcrypt.genSalt = jest.fn().mockResolvedValue("salt");
      bcrypt.hash = jest.fn().mockResolvedValue("hash");
      dbRunMock.mockImplementation((sql, p, cb) => cb(new Error("db run fail")));
      await expect(
        userDao.createUser({ username: "a", email: "e", name: "n", surname: "s", password: "p" })
      ).rejects.toThrow("db run fail");
    });

    it("resolves correctly on success", async () => {
      bcrypt.genSalt = jest.fn().mockResolvedValue("salt");
      bcrypt.hash = jest.fn().mockResolvedValue("hash");
      dbRunMock.mockImplementation(function (sql, params, cb) {
        cb.call({ lastID: 123 }, null);
      });
      const res = await userDao.createUser({
        username: "a",
        email: "e",
        name: "n",
        surname: "s",
        password: "p",
      });
      expect(res).toEqual({
        id: 123,
        username: "a",
        email: "e",
        name: "n",
        surname: "s",
        type: "citizen",
      });
    });
  });

  describe("updateUserTypeById", () => {
    it("rejects invalid role", async () => {
      await expect(userDao.updateUserTypeById(1, "xxx")).rejects.toThrow("Invalid role");
    });

    it("rejects on DB error", async () => {
      dbRunMock.mockImplementation((sql, p, cb) => cb(new Error("fail")));
      await expect(userDao.updateUserTypeById(1, ALLOWED_ROLES[0])).rejects.toThrow("fail");
    });

    it("resolves null if no row updated", async () => {
      dbRunMock.mockImplementation(function (sql, p, cb) {
        cb.call({ changes: 0 }, null);
      });
      const res = await userDao.updateUserTypeById(1, ALLOWED_ROLES[0]);
      expect(res).toBeNull();
    });

    it("resolves updated user if row updated", async () => {
      dbRunMock.mockImplementation(function (sql, p, cb) {
        cb.call({ changes: 1 }, null);
      });
      const res = await userDao.updateUserTypeById(1, ALLOWED_ROLES[0]);
      expect(res).toEqual({ id: 1, type: ALLOWED_ROLES[0] });
    });

    it("rejects if db.run throws synchronously", async () => {
      dbRunMock.mockImplementation(() => {
        throw new Error("sync fail");
      });
      await expect(userDao.updateUserTypeById(1, ALLOWED_ROLES[0])).rejects.toThrow("sync fail");
    });

    it("handles missing this.changes safely", async () => {
      dbRunMock.mockImplementation((sql, p, cb) => cb(null));
      const result = await userDao.updateUserTypeById(1, ALLOWED_ROLES[0]);
      // If no 'this.changes', assume success path
      expect(result).toEqual({ id: 1, type: ALLOWED_ROLES[0] });
    });

  });

  describe("findMunicipalityUsers", () => {
    it("rejects on DB error", async () => {
      dbAllMock.mockImplementation((sql, p, cb) => cb(new Error("fail")));
      await expect(userDao.findMunicipalityUsers()).rejects.toThrow("fail");
    });

    it("resolves with rows", async () => {
      const rows = [{ id: 1 }, { id: 2 }];
      dbAllMock.mockImplementation((sql, p, cb) => cb(null, rows));
      const res = await userDao.findMunicipalityUsers();
      expect(res).toEqual(rows);
    });

    it("resolves empty array when rows undefined", async () => {
      dbAllMock.mockImplementation((sql, p, cb) => cb(null, undefined));
      const res = await userDao.findMunicipalityUsers();
      expect(res).toEqual([]);
    });
  });
});
