/*"use strict";

jest.mock("sqlite3", () => {
  const mockDb = {
    run: jest.fn(),
    get: jest.fn(),
  };
  const Database = jest.fn((path, cb) => {
    if (cb) cb(null);
    return mockDb;
  });
  return { Database, __mockDb: mockDb };
});

const { __mockDb: mockDb } = require("sqlite3");
const reportDao = require("../../server/dao/reportDao");

describe("reportDao Module Loading", () => {
  it("throws on DB connection error", () => {
    const sqlite3 = require("sqlite3");
    sqlite3.Database.mockImplementationOnce(() => {
      throw new Error("DB Connection Fail");
    });

    expect(() => require("../../server/dao/reportDao")).toThrow("DB Connection Fail");
  });
});

describe("reportDao Functions", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("createReport", () => {
    it("resolves with created report", async () => {
      const fakeRow = {
        id: 1, userId: 1, latitude: 45, longitude: 7, title: "t", description: "d",
        category: "c", image_path1: "p1", image_path2: "p2", image_path3: "p3",
        status: "pending", created_at: "2025-11-12 22:19:20", updated_at: "2025-11-12 22:19:20"
      };
      mockDb.run.mockImplementation(function (_sql, _p, cb) {
        this.lastID = 1;
        cb.call(this, null);
      });
      mockDb.get.mockImplementation((_sql, _p, cb) => cb(null, fakeRow));

      const res = await reportDao.createReport({
        userId: 1, latitude: 45, longitude: 7, title: "t", description: "d",
        category: "c", photos: ["p1", "p2", "p3"]
      });

      expect(res).toEqual(fakeRow);
    });

    it("rejects when db.run fails", async () => {
      const dbError = new Error("insert fail");
      mockDb.run.mockImplementation((_sql, _p, cb) => cb(dbError));

      await expect(reportDao.createReport({
        userId: 1, latitude: 1, longitude: 2, title: "t", description: "d",
        category: "c", photos: ["a"]
      })).rejects.toThrow("insert fail");
    });

    it("rejects when db.get fails", async () => {
      mockDb.run.mockImplementation(function (_sql, _p, cb) { this.lastID = 1; cb(null); });
      mockDb.get.mockImplementation((_sql, _p, cb) => cb(new Error("select fail")));

      await expect(reportDao.createReport({
        userId: 1, latitude: 1, longitude: 2, title: "t", description: "d",
        category: "c", photos: ["a"]
      })).rejects.toThrow("select fail");
    });

    it("handles missing optional photos", async () => {
      const fakeRow = { id: 2, userId: 1, latitude: 10, longitude: 20, title: "t", description: "d",
        category: "c", image_path1: "p1", image_path2: null, image_path3: null,
        status: "pending", created_at: "2025-11-12 22:19:20", updated_at: "2025-11-12 22:19:20"
      };
      mockDb.run.mockImplementation(function (_sql, _p, cb) { this.lastID = 2; cb(null); });
      mockDb.get.mockImplementation((_sql, _p, cb) => cb(null, fakeRow));

      const res = await reportDao.createReport({
        userId: 1, latitude: 10, longitude: 20, title: "t", description: "d",
        category: "c", photos: ["p1"]
      });

      expect(res).toEqual(fakeRow);
    });
  });

  describe("getReportById", () => {
    it("resolves with report row", async () => {
      const row = { id: 1, title: "t" };
      mockDb.get.mockImplementation((_sql, _p, cb) => cb(null, row));
      const res = await reportDao.getReportById(1);
      expect(res).toEqual(row);
    });

    it("resolves undefined when not found", async () => {
      mockDb.get.mockImplementation((_sql, _p, cb) => cb(null, undefined));
      const res = await reportDao.getReportById(999);
      expect(res).toBeUndefined();
    });

    it("rejects on db error", async () => {
      mockDb.get.mockImplementation((_sql, _p, cb) => cb(new Error("db fail")));
      await expect(reportDao.getReportById(1)).rejects.toThrow("db fail");
    });
  });
});
*/