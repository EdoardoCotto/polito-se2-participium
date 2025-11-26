"use strict";

// Mock completo stabile di sqlite3 (singola istanza condivisa)
jest.mock("sqlite3", () => {
  const mockDb = { run: jest.fn(), get: jest.fn(), all: jest.fn() };
  const Database = function (path, cb) {
    if (Database.__nextError) {
      const err = Database.__nextError;
      Database.__nextError = null;
      throw err;
    }
    cb && cb(null);
    return mockDb;
  };
  Database.__mockDb = mockDb;
  Database.__setNextError = (err) => (Database.__nextError = err);
  return { Database };
});

// Utility per ottenere DAO e mockDb (senza resetModules per preservare mock)
const loadDao = () => {
  delete require.cache[require.resolve("../../server/dao/reportDao")];
  return require("../../server/dao/reportDao");
};

describe("reportDao", () => {
  beforeEach(() => {
    const sqlite = require("sqlite3");
    const db = sqlite.Database.__mockDb;
    db.run.mockReset();
    db.get.mockReset();
    db.all.mockReset();
    jest.clearAllMocks();
  });

  test("createReport() should reject on insert error", async () => {
    const dao = loadDao();
    const sqlite = require("sqlite3");
    const db = sqlite.Database.__mockDb;
    const insertErr = new Error("Insert fail");
    db.run.mockImplementation(function (sql, params, cb) { cb.call({}, insertErr); });
    await expect(
      dao.createReport({ userId: 1, latitude: 0, longitude: 0, title: "t", description: "d", category: "c", photos: ["p1.jpg"] })
    ).rejects.toThrow("Insert fail");
    expect(db.run).toHaveBeenCalled();
  });

  test("createReport() should reject on select error after successful insert", async () => {
    const dao = loadDao();
    const sqlite = require("sqlite3");
    const db = sqlite.Database.__mockDb;
    db.run.mockImplementation(function (sql, params, cb) { cb.call({ lastID: 55 }, null); });
    db.get.mockImplementation((sql, params, cb) => cb(new Error("Select fail")));
    await expect(
      dao.createReport({ userId: 2, latitude: 1, longitude: 2, title: "x", description: "y", category: "z", photos: ["a.jpg"] })
    ).rejects.toThrow("Select fail");
    expect(db.run).toHaveBeenCalled();
    expect(db.get).toHaveBeenCalled();
  });

  test("createReport() with three photos pads correctly", async () => {
    const dao = loadDao();
    const sqlite = require("sqlite3");
    const db = sqlite.Database.__mockDb;
    db.run.mockImplementation(function (sql, params, cb) {
      // params positions for image paths 7,8,9
      expect(params[6]).toBe("p1.jpg");
      expect(params[7]).toBe("p2.jpg");
      expect(params[8]).toBe("p3.jpg");
      cb.call({ lastID: 77 }, null);
    });
    const fakeReport = { id: 77, image_path1: "p1.jpg", image_path2: "p2.jpg", image_path3: "p3.jpg" };
    db.get.mockImplementation((sql, params, cb) => cb(null, fakeReport));
    const result = await dao.createReport({ userId: 9, latitude: 4, longitude: 5, title: "photos", description: "desc", category: "info", photos: ["p1.jpg", "p2.jpg", "p3.jpg"] });
    expect(result.image_path2).toBe("p2.jpg");
    expect(result.image_path3).toBe("p3.jpg");
  });

  test("should throw when DB connection fails", () => {
    const sqlite = require("sqlite3");
    sqlite.Database.__setNextError(new Error("DB Connection Fail"));
    expect(() => loadDao()).toThrow(/DB Connection Fail/);
  });

  test("getReportById() should return a report", async () => {
    const dao = loadDao();
    const sqlite = require("sqlite3");
    const db = sqlite.Database.__mockDb;
    const fakeReport = { id: 10, title: "Test", status: "pending" };
    db.get.mockImplementation((sql, params, cb) => cb(null, fakeReport));
    const result = await dao.getReportById(10);
    expect(db.get).toHaveBeenCalled();
    expect(result).toEqual(fakeReport);
  });

  test("getReportById() should reject on error", async () => {
    const dao = loadDao();
    const sqlite = require("sqlite3");
    const db = sqlite.Database.__mockDb;
    db.get.mockImplementation((sql, params, cb) => cb(new Error("Get by id fail")));
    await expect(dao.getReportById(11)).rejects.toThrow("Get by id fail");
    expect(db.get).toHaveBeenCalled();
  });

  test("getReportsByStatus() should return rows", async () => {
    const dao = loadDao();
    const sqlite = require("sqlite3");
    const db = sqlite.Database.__mockDb;
    const rows = [{ id: 1 }, { id: 2 }];
    db.all.mockImplementation((sql, params, cb) => cb(null, rows));
    const result = await dao.getReportsByStatus("pending");
    expect(db.all).toHaveBeenCalled();
    expect(result).toEqual(rows);
  });

  test("createReport() should insert and return created row", async () => {
    const dao = loadDao();
    const sqlite = require("sqlite3");
    const db = sqlite.Database.__mockDb;
    db.run.mockImplementation(function (sql, params, cb) {
      cb.call({ lastID: 42 }, null);
    });
    const fakeReport = { id: 42, userId: 7, title: "Hello", description: "World", category: "info", image_path1: "a.jpg", image_path2: null, image_path3: null, status: "pending" };
    db.get.mockImplementation((sql, params, cb) => cb(null, fakeReport));
    const result = await dao.createReport({ userId: 7, latitude: 1.1, longitude: 1.2, title: "Hello", description: "World", category: "info", photos: ["a.jpg"] });
    expect(db.run).toHaveBeenCalled();
    expect(db.get).toHaveBeenCalled();
    expect(result).toEqual(fakeReport);
  });
  test("updateReportReview() should update and return updated row", async () => {
    const dao = loadDao();
    const sqlite = require("sqlite3");
    const db = sqlite.Database.__mockDb;
    db.run.mockImplementation(function (sql, params, cb) { cb.call({ changes: 1 }, null); });
    const updatedRow = { id: 10, status: "approved", technical_office: "Tech A" };
    db.get.mockImplementation((sql, params, cb) => cb(null, updatedRow));
    const result = await dao.updateReportReview(10, { status: "approved", rejectionReason: null, technicalOffice: "Tech A" });
    expect(db.run).toHaveBeenCalled();
    expect(db.get).toHaveBeenCalled();
    expect(result).toEqual(updatedRow);
  });

  test("updateReportReview() should reject on run error", async () => {
    const dao = loadDao();
    const sqlite = require("sqlite3");
    const db = sqlite.Database.__mockDb;
    const runErr = new Error("Run fail");
    db.run.mockImplementation(function (sql, params, cb) { cb.call({}, runErr); });
    await expect(
      dao.updateReportReview(10, { status: "approved", rejectionReason: null, technicalOffice: null })
    ).rejects.toThrow("Run fail");
    expect(db.run).toHaveBeenCalled();
  });

  test("updateReportReview() should reject on select error", async () => {
    const dao = loadDao();
    const sqlite = require("sqlite3");
    const db = sqlite.Database.__mockDb;
    db.run.mockImplementation(function (sql, params, cb) { cb.call({ changes: 1 }, null); });
    db.get.mockImplementation((sql, params, cb) => cb(new Error("Updated select fail")));
    await expect(
      dao.updateReportReview(11, { status: "approved", rejectionReason: null, technicalOffice: null })
    ).rejects.toThrow("Updated select fail");
    expect(db.get).toHaveBeenCalled();
  });

  test("getReportsByStatus() should apply boundingBox filter", async () => {
    const dao = loadDao();
    const sqlite = require("sqlite3");
    const db = sqlite.Database.__mockDb;
    const rows = [{ id: 3 }];
    db.all.mockImplementation((sql, params, cb) => {
      expect(sql).toMatch(/BETWEEN \?/); // bounding box added
      expect(params.length).toBe(5); // status + 4 bounds
      cb(null, rows);
    });
    const result = await dao.getReportsByStatus("pending", { boundingBox: { south: 0, north: 10, west: 0, east: 10 } });
    expect(result).toEqual(rows);
  });

  test("getReportsByStatus() should reject on error", async () => {
    const dao = loadDao();
    const sqlite = require("sqlite3");
    const db = sqlite.Database.__mockDb;
    db.all.mockImplementation((sql, params, cb) => cb(new Error("Status fail")));
    await expect(dao.getReportsByStatus("pending")).rejects.toThrow("Status fail");
  });

  test("getReportsByStatus() should return [] when rows undefined", async () => {
    const dao = loadDao();
    const sqlite = require("sqlite3");
    const db = sqlite.Database.__mockDb;
    db.all.mockImplementation((sql, params, cb) => cb(null, undefined));
    const result = await dao.getReportsByStatus("pending");
    expect(result).toEqual([]);
  });

  test("getReportsByOfficerId() should return rows", async () => {
    const dao = loadDao();
    const sqlite = require("sqlite3");
    const db = sqlite.Database.__mockDb;
    const rows = [{ reportId: 1 }];
    db.all.mockImplementation((sql, params, cb) => cb(null, rows));
    const result = await dao.getReportsByOfficerId(123);
    expect(result).toEqual(rows);
  });

  test("getReportsByOfficerId() should return [] when undefined", async () => {
    const dao = loadDao();
    const sqlite = require("sqlite3");
    const db = sqlite.Database.__mockDb;
    db.all.mockImplementation((sql, params, cb) => cb(null, undefined));
    const result = await dao.getReportsByOfficerId(123);
    expect(result).toEqual([]);
  });

  test("getReportsByOfficerId() should reject on error", async () => {
    const dao = loadDao();
    const sqlite = require("sqlite3");
    const db = sqlite.Database.__mockDb;
    db.all.mockImplementation((sql, params, cb) => cb(new Error("Officer fail")));
    await expect(dao.getReportsByOfficerId(123)).rejects.toThrow("Officer fail");
  });

  // getCitizenReports coverage (success, undefined rows, error, boundingBox)
  test("getCitizenReports() should return rows", async () => {
    const dao = loadDao();
    const sqlite = require("sqlite3");
    const db = sqlite.Database.__mockDb;
    const rows = [{ id: 7 }];
    db.all.mockImplementation((sql, params, cb) => cb(null, rows));
    const result = await dao.getCitizenReports();
    expect(db.all).toHaveBeenCalled();
    expect(result).toEqual(rows);
  });

  test("getCitizenReports() should return [] when rows undefined", async () => {
    const dao = loadDao();
    const sqlite = require("sqlite3");
    const db = sqlite.Database.__mockDb;
    db.all.mockImplementation((sql, params, cb) => cb(null, undefined));
    const result = await dao.getCitizenReports();
    expect(result).toEqual([]);
  });

  test("getCitizenReports() should reject on error", async () => {
    const dao = loadDao();
    const sqlite = require("sqlite3");
    const db = sqlite.Database.__mockDb;
    db.all.mockImplementation((sql, params, cb) => cb(new Error("Citizen fail")));
    await expect(dao.getCitizenReports()).rejects.toThrow("Citizen fail");
  });

  test("getCitizenReports() should apply boundingBox filter", async () => {
    const dao = loadDao();
    const sqlite = require("sqlite3");
    const db = sqlite.Database.__mockDb;
    const rows = [{ id: 8 }];
    db.all.mockImplementation((sql, params, cb) => {
      expect(sql).toMatch(/BETWEEN \?/);
      expect(params.length).toBe(4); // 4 bounds (no status param in citizen query)
      cb(null, rows);
    });
    const result = await dao.getCitizenReports({ boundingBox: { south: 0, north: 10, west: 0, east: 10 } });
    expect(result).toEqual(rows);
  });

  test("getLeastLoadedOfficer() should return id", async () => {
    const dao = loadDao();
    const sqlite = require("sqlite3");
    const db = sqlite.Database.__mockDb;
    db.get.mockImplementation((sql, params, cb) => cb(null, { id: 99, workload: 1 }));
    const result = await dao.getLeastLoadedOfficer("technical_office_staff");
    expect(result).toBe(99);
  });

  test("getLeastLoadedOfficer() should return null when no row", async () => {
    const dao = loadDao();
    const sqlite = require("sqlite3");
    const db = sqlite.Database.__mockDb;
    db.get.mockImplementation((sql, params, cb) => cb(null, undefined));
    const result = await dao.getLeastLoadedOfficer("technical_office_staff");
    expect(result).toBeNull();
  });

  test("getLeastLoadedOfficer() should reject on error", async () => {
    const dao = loadDao();
    const sqlite = require("sqlite3");
    const db = sqlite.Database.__mockDb;
    db.get.mockImplementation((sql, params, cb) => cb(new Error("Least fail")));
    await expect(dao.getLeastLoadedOfficer("technical_office_staff")).rejects.toThrow("Least fail");
  });

  test("updateReportReview() should return null if no row updated", async () => {
    const dao = loadDao();
    const sqlite = require("sqlite3");
    const db = sqlite.Database.__mockDb;
    db.run.mockImplementation(function (sql, params, cb) { cb.call({ changes: 0 }, null); });
    const result = await dao.updateReportReview(999, { status: "rejected", rejectionReason: "bad", technicalOffice: "Tech B" });
    expect(result).toBeNull();
    expect(db.run).toHaveBeenCalled();
  });
});
