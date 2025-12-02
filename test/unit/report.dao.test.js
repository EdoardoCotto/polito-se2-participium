"use strict";

// Helper to get sqlite3 module
// Node's module resolution will automatically find sqlite3 in node_modules
const getSqlite3Module = () => {
  // eslint-disable-next-line global-require
  return require("sqlite3");
};

// Helper to load DAO with a spy-mocked sqlite3 Database that the DAO will use
const withDao = (overrides = {}) => {
  const { ctorError, runImpl, getImpl, allImpl } = overrides;
  jest.resetModules();
  // Get the sqlite3 instance that server DAO will resolve
  const sqlite = getSqlite3Module();
  const mockDb = { run: jest.fn(), get: jest.fn(), all: jest.fn() };
  if (runImpl) mockDb.run.mockImplementation(runImpl);
  if (getImpl) mockDb.get.mockImplementation(getImpl);
  if (allImpl) mockDb.all.mockImplementation(allImpl);

  const ctorSpy = jest
    .spyOn(sqlite, "Database")
    .mockImplementation(function (_path, cb) {
      if (ctorError) throw ctorError;
      cb && cb(null);
      return mockDb;
    });

  let dao;
  jest.isolateModules(() => {
    // eslint-disable-next-line global-require
    dao = require("../../server/dao/reportDao");
  });

  return { dao, mockDb, restore: () => ctorSpy.mockRestore() };
};

describe("reportDao", () => {
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test("createReport() should reject on insert error", async () => {
    const insertErr = new Error("Insert fail");
    const { dao, mockDb, restore } = withDao({ runImpl: (_s, _p, cb) => cb.call({}, insertErr) });
    await expect(
      dao.createReport({ userId: 1, latitude: 0, longitude: 0, title: "t", description: "d", category: "info", photos: ["p1.jpg"] })
    ).rejects.toThrow("Insert fail");
    expect(mockDb.run).toHaveBeenCalled();
    restore();
  });

  test("createReport() should reject on select error after successful insert", async () => {
    const { dao, mockDb, restore } = withDao({
      runImpl: (_s, _p, cb) => cb.call({ lastID: 55 }, null),
      getImpl: (_s, _p, cb) => cb(new Error("Select fail")),
    });
    await expect(
      dao.createReport({ userId: 2, latitude: 1, longitude: 2, title: "x", description: "y", category: "info", photos: ["a.jpg"] })
    ).rejects.toThrow("Select fail");
    expect(mockDb.run).toHaveBeenCalled();
    expect(mockDb.get).toHaveBeenCalled();
    restore();
  });

  test("createReport() with three photos pads correctly", async () => {
    const { dao, mockDb, restore } = withDao();
    mockDb.run.mockImplementation(function (_sql, params, cb) {
      expect(params[6]).toBe("p1.jpg");
      expect(params[7]).toBe("p2.jpg");
      expect(params[8]).toBe("p3.jpg");
      cb.call({ lastID: 77 }, null);
    });
    const fakeReport = { id: 77, image_path1: "p1.jpg", image_path2: "p2.jpg", image_path3: "p3.jpg" };
    mockDb.get.mockImplementation((_sql, _params, cb) => cb(null, fakeReport));
    const result = await dao.createReport({ userId: 9, latitude: 4, longitude: 5, title: "photos", description: "desc", category: "info", photos: ["p1.jpg", "p2.jpg", "p3.jpg"] });
    expect(result.image_path2).toBe("p2.jpg");
    expect(result.image_path3).toBe("p3.jpg");
    restore();
  });

  test("should throw when DB connection fails", () => {
    jest.resetModules();
    const sqlite = getSqlite3Module();
    jest
      .spyOn(sqlite, "Database")
      .mockImplementation((_p, _cb) => {
        throw new Error("DB Connection Fail");
      });

    expect(() => {
      jest.isolateModules(() => {
        // eslint-disable-next-line global-require
        require("../../server/dao/reportDao");
      });
    }).toThrow(/DB Connection Fail/);
  });

  test("getReportById() should return a report", async () => {
    const fakeReport = { id: 10, title: "Test", status: "pending" };
    const { dao, mockDb, restore } = withDao({ getImpl: (_s, _p, cb) => cb(null, fakeReport) });
    const result = await dao.getReportById(10);
    expect(mockDb.get).toHaveBeenCalled();
    expect(result).toEqual(fakeReport);
    restore();
  });

  test("getReportById() should reject on error", async () => {
    const { dao, mockDb, restore } = withDao({ getImpl: (_s, _p, cb) => cb(new Error("Get by id fail")) });
    await expect(dao.getReportById(11)).rejects.toThrow("Get by id fail");
    expect(mockDb.get).toHaveBeenCalled();
    restore();
  });

  test("getReportsByStatus() should return rows", async () => {
    const rows = [{ id: 1 }, { id: 2 }];
    const { dao, mockDb, restore } = withDao({ allImpl: (_s, _p, cb) => cb(null, rows) });
    const result = await dao.getReportsByStatus("pending");
    expect(mockDb.all).toHaveBeenCalled();
    expect(result).toEqual(rows);
    restore();
  });

  test("getReportsByStatus() handles null options gracefully", async () => {
    const rows = [{ id: 5 }];
    const { dao, mockDb, restore } = withDao();
    mockDb.all.mockImplementation((sql, params, cb) => {
      expect(params).toEqual(["pending"]);
      cb(null, rows);
    });
    const result = await dao.getReportsByStatus("pending", null);
    expect(result).toEqual(rows);
    restore();
  });

  test("createReport() should insert and return created row", async () => {
    const { dao, mockDb, restore } = withDao();
    mockDb.run.mockImplementation(function (_sql, _params, cb) { cb.call({ lastID: 42 }, null); });
    const fakeReport = { id: 42, userId: 7, title: "Hello", description: "World", category: "info", image_path1: "a.jpg", image_path2: null, image_path3: null, status: "pending" };
    mockDb.get.mockImplementation((_sql, _params, cb) => cb(null, fakeReport));
    const result = await dao.createReport({ userId: 7, latitude: 1.1, longitude: 1.2, title: "Hello", description: "World", category: "info", photos: ["a.jpg"] });
    expect(mockDb.run).toHaveBeenCalled();
    expect(mockDb.get).toHaveBeenCalled();
    expect(result).toEqual(fakeReport);
    restore();
  });

  test("createReport() defaults userId to null when omitted", async () => {
    const { dao, mockDb, restore } = withDao();
    mockDb.run.mockImplementation(function (_sql, params, cb) {
      expect(params[0]).toBeNull();
      cb.call({ lastID: 101 }, null);
    });
    const fake = { id: 101 };
    mockDb.get.mockImplementation((_s, _p, cb) => cb(null, fake));
    const res = await dao.createReport({ latitude: 0, longitude: 0, title: "t", description: "d", category: "info", photos: ["p.jpg"] });
    expect(res).toEqual(fake);
    restore();
  });

  test("createReport() with two photos pads third as null", async () => {
    const { dao, mockDb, restore } = withDao();
    mockDb.run.mockImplementation(function (_sql, params, cb) {
      expect(params[6]).toBe("p1.jpg");
      expect(params[7]).toBe("p2.jpg");
      expect(params[8]).toBeNull();
      cb.call({ lastID: 202 }, null);
    });
    const fake = { id: 202 };
    mockDb.get.mockImplementation((_s, _p, cb) => cb(null, fake));
    const res = await dao.createReport({ userId: 1, latitude: 0, longitude: 0, title: "t", description: "d", category: "info", photos: ["p1.jpg", "p2.jpg"] });
    expect(res).toEqual(fake);
    restore();
  });

  test("updateReportReview() should update and return updated row", async () => {
    const updatedRow = { id: 10, status: "approved", technical_office: "Tech A" };
    const { dao, mockDb, restore } = withDao({
      runImpl: (_s, _p, cb) => cb.call({ changes: 1 }, null),
      getImpl: (_s, _p, cb) => cb(null, updatedRow),
    });
    const result = await dao.updateReportReview(10, { status: "approved", rejectionReason: null, technicalOffice: "Tech A" });
    expect(mockDb.run).toHaveBeenCalled();
    expect(mockDb.get).toHaveBeenCalled();
    expect(result).toEqual(updatedRow);
    restore();
  });

  test("updateReportReview() should reject on run error", async () => {
    const runErr = new Error("Run fail");
    const { dao, mockDb, restore } = withDao({ runImpl: (_s, _p, cb) => cb.call({}, runErr) });
    await expect(
      dao.updateReportReview(10, { status: "approved", rejectionReason: null, technicalOffice: null })
    ).rejects.toThrow("Run fail");
    expect(mockDb.run).toHaveBeenCalled();
    restore();
  });

  test("updateReportReview() should reject on select error", async () => {
    const { dao, mockDb, restore } = withDao({
      runImpl: (_s, _p, cb) => cb.call({ changes: 1 }, null),
      getImpl: (_s, _p, cb) => cb(new Error("Updated select fail")),
    });
    await expect(
      dao.updateReportReview(11, { status: "approved", rejectionReason: null, technicalOffice: null })
    ).rejects.toThrow("Updated select fail");
    expect(mockDb.get).toHaveBeenCalled();
    restore();
  });

  test("getReportsByStatus() should apply boundingBox filter", async () => {
    const rows = [{ id: 3 }];
    const { dao, mockDb, restore } = withDao();
    mockDb.all.mockImplementation((sql, params, cb) => {
      expect(sql).toMatch(/BETWEEN \?/);
      expect(params.length).toBe(5);
      cb(null, rows);
    });
    const result = await dao.getReportsByStatus("pending", { boundingBox: { south: 0, north: 10, west: 0, east: 10 } });
    expect(result).toEqual(rows);
    restore();
  });

  test("getReportsByStatus() should reject on error", async () => {
    const { dao, restore } = withDao({ allImpl: (_s, _p, cb) => cb(new Error("Status fail")) });
    await expect(dao.getReportsByStatus("pending")).rejects.toThrow("Status fail");
    restore();
  });

  test("getReportsByStatus() should return [] when rows undefined", async () => {
    const { dao, restore } = withDao({ allImpl: (_s, _p, cb) => cb(null, undefined) });
    const result = await dao.getReportsByStatus("pending");
    expect(result).toEqual([]);
    restore();
  });

  test("getReportsByOfficerId() should return rows", async () => {
    const rows = [{ reportId: 1 }];
    const { dao, restore } = withDao({ allImpl: (_s, _p, cb) => cb(null, rows) });
    const result = await dao.getReportsByOfficerId(123);
    expect(result).toEqual(rows);
    restore();
  });

  test("getReportsByOfficerId() should return [] when undefined", async () => {
    const { dao, restore } = withDao({ allImpl: (_s, _p, cb) => cb(null, undefined) });
    const result = await dao.getReportsByOfficerId(123);
    expect(result).toEqual([]);
    restore();
  });

  test("getReportsByOfficerId() should reject on error", async () => {
    const { dao, restore } = withDao({ allImpl: (_s, _p, cb) => cb(new Error("Officer fail")) });
    await expect(dao.getReportsByOfficerId(123)).rejects.toThrow("Officer fail");
    restore();
  });

  // getCitizenReports coverage (success, undefined rows, error, boundingBox)
  test("getCitizenReports() should return rows", async () => {
    const rows = [{ id: 7 }];
    const { dao, mockDb, restore } = withDao({ allImpl: (_s, _p, cb) => cb(null, rows) });
    const result = await dao.getCitizenReports();
    expect(mockDb.all).toHaveBeenCalled();
    expect(result).toEqual(rows);
    restore();
  });

  test("getCitizenReports() handles null options gracefully", async () => {
    const rows = [{ id: 9 }];
    const { dao, mockDb, restore } = withDao();
    mockDb.all.mockImplementation((sql, params, cb) => {
      expect(Array.isArray(params)).toBe(true);
      expect(params.length).toBe(0);
      cb(null, rows);
    });
    const result = await dao.getCitizenReports(null);
    expect(result).toEqual(rows);
    restore();
  });

  test("getCitizenReports() should return [] when rows undefined", async () => {
    const { dao, restore } = withDao({ allImpl: (_s, _p, cb) => cb(null, undefined) });
    const result = await dao.getCitizenReports();
    expect(result).toEqual([]);
    restore();
  });

  test("getCitizenReports() should reject on error", async () => {
    const { dao, restore } = withDao({ allImpl: (_s, _p, cb) => cb(new Error("Citizen fail")) });
    await expect(dao.getCitizenReports()).rejects.toThrow("Citizen fail");
    restore();
  });

  test("getCitizenReports() should apply boundingBox filter", async () => {
    const rows = [{ id: 8 }];
    const { dao, mockDb, restore } = withDao();
    mockDb.all.mockImplementation((sql, params, cb) => {
      expect(sql).toMatch(/BETWEEN \?/);
      expect(params.length).toBe(4);
      cb(null, rows);
    });
    const result = await dao.getCitizenReports({ boundingBox: { south: 0, north: 10, west: 0, east: 10 } });
    expect(result).toEqual(rows);
    restore();
  });

  test("getLeastLoadedOfficer() should return id", async () => {
    const { dao, restore } = withDao({ getImpl: (_s, _p, cb) => cb(null, { id: 99, workload: 1 }) });
    const result = await dao.getLeastLoadedOfficer("technical_office_staff");
    expect(result).toBe(99);
    restore();
  });

  test("getLeastLoadedOfficer() should return null when no row", async () => {
    const { dao, restore } = withDao({ getImpl: (_s, _p, cb) => cb(null, undefined) });
    const result = await dao.getLeastLoadedOfficer("technical_office_staff");
    expect(result).toBeNull();
    restore();
  });

  test("getLeastLoadedOfficer() should reject on error", async () => {
    const { dao, restore } = withDao({ getImpl: (_s, _p, cb) => cb(new Error("Least fail")) });
    await expect(dao.getLeastLoadedOfficer("technical_office_staff")).rejects.toThrow("Least fail");
    restore();
  });

  test("updateReportReview() should return null if no row updated", async () => {
    const { dao, mockDb, restore } = withDao({ runImpl: (_s, _p, cb) => cb.call({ changes: 0 }, null) });
    const result = await dao.updateReportReview(999, { status: "rejected", rejectionReason: "bad", technicalOffice: "Tech B" });
    expect(result).toBeNull();
    expect(mockDb.run).toHaveBeenCalled();
    restore();
  });
});
