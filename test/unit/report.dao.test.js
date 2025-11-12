"use strict";

// Mock for sqlite3
const dbRunMock = jest.fn();
const dbGetMock = jest.fn();

jest.mock("sqlite3", () => {
  const mDb = function () {
    return { run: dbRunMock, get: dbGetMock };
  };
  return { Database: mDb };
});

const reportDao = require("../../server/dao/reportDao");

describe("reportDao", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createReport", () => {
    it("rejects when db.run fails", async () => {
      dbRunMock.mockImplementation((sql, p, cb) => cb(new Error("insert fail")));
      await expect(
        reportDao.createReport({
          userId: 1,
          latitude: 1,
          longitude: 2,
          title: "t",
          description: "d",
          category: "c",
          photos: ["a"],
        })
      ).rejects.toThrow("insert fail");
    });

    it("rejects when db.get fails after insert", async () => {
      dbRunMock.mockImplementation(function (sql, params, cb) {
        cb.call({ lastID: 99 }, null);
      });
      dbGetMock.mockImplementation((sql, p, cb) => cb(new Error("select fail")));

      await expect(
        reportDao.createReport({
          userId: 1,
          latitude: 1,
          longitude: 2,
          title: "t",
          description: "d",
          category: "c",
          photos: ["a"],
        })
      ).rejects.toThrow("select fail");
    });

    it("resolves with created report", async () => {
      dbRunMock.mockImplementation(function (sql, params, cb) {
        cb.call({ lastID: 10 }, null);
      });
      const fakeRow = { id: 10, title: "t" };
      dbGetMock.mockImplementation((sql, p, cb) => cb(null, fakeRow));

      const res = await reportDao.createReport({
        userId: 1,
        latitude: 45,
        longitude: 7,
        title: "t",
        description: "d",
        category: "c",
        photos: ["p1", "p2"],
      });

      expect(res).toEqual(fakeRow);
      expect(dbRunMock).toHaveBeenCalledTimes(1);
      expect(dbGetMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("getReportById", () => {
    it("rejects when db.get fails", async () => {
      dbGetMock.mockImplementation((sql, p, cb) => cb(new Error("db fail")));
      await expect(reportDao.getReportById(1)).rejects.toThrow("db fail");
    });

    it("resolves with report row", async () => {
      const row = { id: 1, title: "T" };
      dbGetMock.mockImplementation((sql, p, cb) => cb(null, row));
      const res = await reportDao.getReportById(1);
      expect(res).toEqual(row);
    });

    it("resolves with undefined row (no match)", async () => {
      dbGetMock.mockImplementation((sql, p, cb) => cb(null, undefined));
      const res = await reportDao.getReportById(999);
      expect(res).toBeUndefined();
    });

  });

    it("handles missing optional photos (null values)", async () => {
      dbRunMock.mockImplementation(function (sql, params, cb) {
        cb.call({ lastID: 1 }, null);
      });
      const fakeRow = { id: 1, title: "null photos" };
      dbGetMock.mockImplementation((sql, p, cb) => cb(null, fakeRow));

      const res = await reportDao.createReport({
        userId: 1,
        latitude: 10,
        longitude: 20,
        title: "t",
        description: "d",
        category: "c",
        photos: ["p1"], // only one photo, rest must become null
      });
      expect(res).toEqual(fakeRow);
    });

    it("logs and rejects insert error explicitly", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      dbRunMock.mockImplementation((sql, p, cb) => cb(new Error("manual insert fail")));
      await expect(
        reportDao.createReport({
          userId: 1,
          latitude: 1,
          longitude: 2,
          title: "x",
          description: "y",
          category: "z",
          photos: ["a"],
        })
      ).rejects.toThrow("manual insert fail");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

});
