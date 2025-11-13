"use strict";

jest.mock("sqlite3", () => {
  const mockDb = {
    get: jest.fn(),
    run: jest.fn(),
    all: jest.fn(),
  };
  const Database = jest.fn((path, cb) => {
    if (typeof cb === "function") cb(null);
    return mockDb;
  });
  return { Database, __mockDb: mockDb };
});

const bcrypt = require("bcrypt");
const { __mockDb: mockDb } = require("sqlite3");
const { ALLOWED_ROLES } = require("../../server/constants/roles");
const userDao = require("../../server/dao/userDao");

describe("userDao Functions", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("getUser", () => {
    it("resolves user if username/password match", async () => {
      const hash = await bcrypt.hash("secret", 10);
      mockDb.get.mockImplementation((_sql, _params, cb) => cb(null, {
        id: 1, username: "u", name: "N", surname: "S", type: "citizen", password: hash
      }));

      const user = await userDao.getUser("u", "secret");
      expect(user).toEqual({ id: 1, username: "u", name: "N", surname: "S", type: "citizen" });
    });

    it("resolves false if username not found", async () => {
      mockDb.get.mockImplementation((_sql, _params, cb) => cb(null, undefined));
      const res = await userDao.getUser("x", "secret");
      expect(res).toBe(false);
    });

    it("resolves false if password wrong", async () => {
      const hash = await bcrypt.hash("secret", 10);
      mockDb.get.mockImplementation((_sql, _params, cb) => cb(null, {
        id: 1, username: "u", name: "N", surname: "S", type: "citizen", password: hash
      }));
      const res = await userDao.getUser("u", "wrong");
      expect(res).toBe(false);
    });

    it("rejects on db error", async () => {
      mockDb.get.mockImplementation((_sql, _params, cb) => cb(new Error("fail")));
      await expect(userDao.getUser("u", "pass")).rejects.toThrow("fail");
    });
  });

  describe("createUser", () => {
    it("resolves created user with id", async () => {
      mockDb.run.mockImplementation(function (sql, params, cb) {
        this.lastID = 1;
        cb.call(this, null);
      });

      const newUser = await userDao.createUser({
        username: "u",
        email: "e",
        name: "N",
        surname: "S",
        password: "secret"
      });

      expect(newUser).toEqual({ id: 1, username: "u", email: "e", name: "N", surname: "S", type: "citizen" });
    });

    it("rejects on insert error", async () => {
      mockDb.run.mockImplementation((_sql, _params, cb) => cb(new Error("fail")));
      await expect(userDao.createUser({
        username: "u", email: "e", name: "N", surname: "S", password: "p"
      })).rejects.toThrow("fail");
    });
  });

  describe("updateUserTypeById", () => {
    it("resolves updated user if row updated", async () => {
      mockDb.run.mockImplementation(function (sql, params, cb) {
        this.changes = 1;
        cb.call(this, null);
      });

      const res = await userDao.updateUserTypeById(1, ALLOWED_ROLES[0]);
      expect(res).toEqual({ id: 1, type: ALLOWED_ROLES[0] });
    });

    it("resolves null if no row updated", async () => {
      mockDb.run.mockImplementation(function (sql, params, cb) {
        this.changes = 0;
        cb.call(this, null);
      });

      const res = await userDao.updateUserTypeById(1, ALLOWED_ROLES[0]);
      expect(res).toBeNull();
    });

    it("rejects if db.run errors", async () => {
      mockDb.run.mockImplementation(function (sql, params, cb) {
        cb.call(this, new Error("sync fail"));
      });
      await expect(userDao.updateUserTypeById(1, ALLOWED_ROLES[0])).rejects.toThrow("sync fail");
    });

    it("rejects if role invalid", async () => {
      await expect(userDao.updateUserTypeById(1, "invalid")).rejects.toThrow(/Invalid role/);
    });
  });

  describe("findMunicipalityUsers", () => {
    it("resolves rows", async () => {
      const rows = [{ id: 1 }, { id: 2 }];
      mockDb.all.mockImplementation((_sql, _p, cb) => cb(null, rows));
      const res = await userDao.findMunicipalityUsers();
      expect(res).toEqual(rows);
    });

    it("resolves empty array if undefined", async () => {
      mockDb.all.mockImplementation((_sql, _p, cb) => cb(null, undefined));
      const res = await userDao.findMunicipalityUsers();
      expect(res).toEqual([]);
    });

    it("rejects on error", async () => {
      mockDb.all.mockImplementation((_sql, _p, cb) => cb(new Error("fail")));
      await expect(userDao.findMunicipalityUsers()).rejects.toThrow("fail");
    });
  });
});
