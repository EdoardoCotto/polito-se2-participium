"use strict";

//Mock completo di sqlite3
jest.mock("sqlite3", () => {
  const mockDb = {
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn(),
  };

  // Simula errori di connessione
  const Database = jest.fn((path, cb) => {
    if (Database.__nextError) {
      const err = Database.__nextError;
      Database.__nextError = null;
      throw err; // questo fa scattare il throw del DAO
    }
    cb && cb(null);
    return mockDb;
  });

  Database.__mockDb = mockDb;
  Database.__setNextError = (err) => (Database.__nextError = err);

  return { Database };
});

const sqlite = require("sqlite3");

// 🧠 Funzione per caricare il DAO dopo aver impostato il mock
const loadDao = () => {
  jest.resetModules(); // ricarica il modulo
  return require("../../server/dao/reportDao");
};

describe("reportDao", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should throw when DB connection fails", () => {
    sqlite.Database.__setNextError(new Error("DB Connection Fail"));
    expect(() => loadDao()).toThrow("DB Connection Fail");
  });

  test("getReportById() should return a report", async () => {
    const dao = loadDao();
    const db = sqlite.Database.__mockDb;
    const fakeReport = { id: 10, title: "Test", status: "pending" };

    db.get.mockImplementation((sql, params, cb) => cb(null, fakeReport));

    const result = await dao.getReportById(10);
    expect(db.get).toHaveBeenCalled();
    expect(result).toEqual(fakeReport);
  });

  test("getReportsByStatus() should return rows", async () => {
    const dao = loadDao();
    const db = sqlite.Database.__mockDb;
    const rows = [{ id: 1 }, { id: 2 }];

    db.all.mockImplementation((sql, params, cb) => cb(null, rows));

    const result = await dao.getReportsByStatus("pending");
    expect(db.all).toHaveBeenCalled();
    expect(result).toEqual(rows);
  });

  test("createReport() should insert and return created row", async () => {
    const dao = loadDao();
    const db = sqlite.Database.__mockDb;

    // Simula INSERT
    db.run.mockImplementation(function (sql, params, cb) {
      cb.call({ lastID: 42 }, null);
    });

    const fakeReport = {
      id: 42,
      userId: 7,
      title: "Hello",
      description: "World",
      category: "info",
      image_path1: "a.jpg",
      image_path2: null,
      image_path3: null,
      status: "pending",
    };

    // Simula SELECT dopo INSERT
    db.get.mockImplementation((sql, params, cb) => cb(null, fakeReport));

    const result = await dao.createReport({
      userId: 7,
      latitude: 1.1,
      longitude: 1.2,
      title: "Hello",
      description: "World",
      category: "info",
      photos: ["a.jpg"],
    });

    expect(db.run).toHaveBeenCalled();
    expect(db.get).toHaveBeenCalled();
    expect(result).toEqual(fakeReport);
  });

  test("updateReportReview() should update and return updated row", async () => {
    const dao = loadDao();
    const db = sqlite.Database.__mockDb;

    db.run.mockImplementation(function (sql, params, cb) {
      cb.call({ changes: 1 }, null);
    });

    const updatedRow = { id: 10, status: "approved", technical_office: "Tech A" };

    db.get.mockImplementation((sql, params, cb) => cb(null, updatedRow));

    const result = await dao.updateReportReview(10, {
      status: "approved",
      rejectionReason: null,
      technicalOffice: "Tech A",
    });

    expect(db.run).toHaveBeenCalled();
    expect(db.get).toHaveBeenCalled();
    expect(result).toEqual(updatedRow);
  });

  test("updateReportReview() should return null if no row updated", async () => {
    const dao = loadDao();
    const db = sqlite.Database.__mockDb;

    db.run.mockImplementation(function (sql, params, cb) {
      cb.call({ changes: 0 }, null);
    });

    const result = await dao.updateReportReview(999, {
      status: "rejected",
      rejectionReason: "bad",
      technicalOffice: "Tech B",
    });

    expect(result).toBeNull();
    expect(db.run).toHaveBeenCalled();
  });
});
