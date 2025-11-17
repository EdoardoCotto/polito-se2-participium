// test/unit/userDao.test.js
"use strict";

jest.mock("sqlite3", () => {
  const mockDb = { get: jest.fn(), run: jest.fn(), all: jest.fn() };
  const Database = jest.fn((path, cb) => {
    if (Database.__nextError) {
      const err = Database.__nextError;
      Database.__nextError = null;
      if (cb) cb(err);
      else throw err;
    } else if (cb) cb(null);
    return mockDb;
  });
  Database.__mockDb = mockDb;
  Database.__setNextError = (err) => { Database.__nextError = err; };
  return { Database };
});

jest.mock("bcrypt", () => ({
  genSalt: jest.fn(() => Promise.resolve("salt")),
  hash: jest.fn(() => Promise.resolve("hash")),
  compare: jest.fn((pass, hash, cb) => cb(null, true)),
}));

const sqlite = require("sqlite3");
const bcrypt = require("bcrypt");

describe("userDao Functions", () => {
  let dao;
  let db;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      dao = require("../../server/dao/userDao");
    });
    db = sqlite.Database.__mockDb;
  });

  test("should throw when DB connection fails", () => {
    sqlite.Database.__setNextError(new Error("DB Connection Fail"));
    expect(() =>
      jest.isolateModules(() => require("../../server/dao/userDao"))
    ).toThrow("DB Connection Fail");
  });

  test("getUser resolves user if password matches", async () => {
    db.get.mockImplementation((sql, params, cb) =>
      cb(null, { id: 1, username: "u", name: "N", surname: "S", type: "citizen", password: "hash" })
    );

    const res = await dao.getUser("u", "pass");

    expect(db.get).toHaveBeenCalled();
    expect(bcrypt.compare).toHaveBeenCalledWith("pass", "hash", expect.any(Function));
    expect(res).toEqual({ id: 1, username: "u", name: "N", surname: "S", type: "citizen" });
  });

  test("getUser returns false if user not found", async () => {
    db.get.mockImplementation((sql, params, cb) => cb(null, undefined));
    const res = await dao.getUser("u", "pass");
    expect(res).toBe(false);
  });

  test("createUser resolves new user", async () => {
    const newUser = { username: "new", email: "new@test.com", name: "N", surname: "S", type: "citizen", password: "pass" };
    db.run.mockImplementation((sql, params, cb) => cb(null));
    db.run.mockImplementation(function (sql, params, cb) {
      this.lastID = 42;
      cb && cb(null);
    });

    const res = await dao.createUser(newUser);

    expect(db.run).toHaveBeenCalled();
    expect(res).toEqual({ id: 42, ...newUser });
  });

  test("updateUserTypeById resolves updated row", async () => {
    const newType = "municipal_public_relations_officer";
    db.run.mockImplementation(function (sql, params, cb) {
      this.changes = 1;
      cb && cb(null);
    });

    const res = await dao.updateUserTypeById(1, newType);

    expect(db.run).toHaveBeenCalled();
    expect(res).toEqual({ id: 1, type: newType });
  });

  test("updateUserTypeById resolves null if no row updated", async () => {
    const newType = "municipal_public_relations_officer";
    db.run.mockImplementation(function (sql, params, cb) {
      this.changes = 0;
      cb && cb(null);
    });

    const res = await dao.updateUserTypeById(1, newType);
    expect(res).toBeNull();
  });

  test("findMunicipalityUsers returns rows", async () => {
    const rows = [{ id: 1, username: "u", name: "N", surname: "S", email: "u@test.com", type: "municipal_public_relations_officer" }];
    db.all.mockImplementation((sql, params, cb) => cb(null, rows));

    const res = await dao.findMunicipalityUsers();
    expect(db.all).toHaveBeenCalled();
    expect(res).toEqual(rows);
  });

  test("findMunicipalityUsers resolves empty array if undefined", async () => {
    db.all.mockImplementation((sql, params, cb) => cb(null, undefined));

    const res = await dao.findMunicipalityUsers();
    expect(res).toEqual([]);
  });

  test("rejects on db error", async () => {
    const err = new Error("DB fail");
    db.all.mockImplementation((sql, params, cb) => cb(err));

    await expect(dao.findMunicipalityUsers()).rejects.toThrow("DB fail");
  });
});
