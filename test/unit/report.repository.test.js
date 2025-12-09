// report.repository.test.js
// Fully updated unit tests with mocks for reportDao, coherent with your repository

const reportRepository = require("../../server/repository/reportRepository");
const reportDao = require("../../server/dao/reportDao");
const userDao = require("../../server/dao/userDao");
const BadRequestError = require("../../server/errors/BadRequestError");
const NotFoundError = require("../../server/errors/NotFoundError");
const REPORT_STATUSES = require("../../server/constants/reportStatus");
const { TECHNICAL_OFFICER_ROLES } = require("../../server/constants/roles");
const { REPORT_CATEGORIES } = require("../../server/constants/reportCategories");

jest.mock("../../server/dao/reportDao");

beforeEach(() => {
  jest.clearAllMocks();
});

// ----------------------------------------------------
// createReport
// ----------------------------------------------------
describe("reportRepository.createReport", () => {
  const validData = {
    userId: 1,
    latitude: 45,
    longitude: 7,
    title: "Test Title",
    description: "Test Description",
    category: REPORT_CATEGORIES[0],
    photos: ["p1.jpg"],
  };

  test("throws if missing userId when not anonymous", async () => {
    const data = { ...validData, userId: null };

    await expect(reportRepository.createReport(data, false)).rejects.toThrow(
      /User ID, latitude, and longitude are required/i
    );
  });

  test("throws if missing latitude or longitude", async () => {
    const data = { ...validData, latitude: undefined };

    await expect(reportRepository.createReport(data, false)).rejects.toThrow(
      /User ID, latitude, and longitude are required/i
    );
  });

  test("throws if missing longitude (right side of OR)", async () => {
    const data = { ...validData, longitude: undefined };
    await expect(reportRepository.createReport(data, false)).rejects.toThrow(
      /User ID, latitude, and longitude are required/i
    );
  });

  test("throws if title is invalid", async () => {
    const data = { ...validData, title: "  " };

    await expect(reportRepository.createReport(data, false)).rejects.toThrow(
      /Title is required/i
    );
  });

  test("throws if title is not a string (left side of OR)", async () => {
    const data = { ...validData, title: 42 };
    await expect(reportRepository.createReport(data, false)).rejects.toThrow(/Title is required/i);
  });

  test("throws if category invalid", async () => {
    const data = { ...validData, category: "NOPE" };

    await expect(reportRepository.createReport(data, false)).rejects.toThrow(
      /Category is invalid/i
    );
  });

  test("throws if category is not a string (left side of OR)", async () => {
    const data = { ...validData, category: 123 };
    await expect(reportRepository.createReport(data, false)).rejects.toThrow(/Category is invalid/i);
  });

  test("throws if photos array length invalid", async () => {
    const data = { ...validData, photos: [] };

    await expect(reportRepository.createReport(data, false)).rejects.toThrow(
      /Photos array must contain between 1 and 3 items/i
    );
  });

  test("throws if photos array too long (right side of OR)", async () => {
    const data = { ...validData, photos: ["a.jpg", "b.jpg", "c.jpg", "d.jpg"] };
    await expect(reportRepository.createReport(data, false)).rejects.toThrow(/Photos array must contain between 1 and 3 items/i);
  });

  test("throws if dao returns null", async () => {
    jest.spyOn(userDao, 'getUserById').mockResolvedValue({ id: 1, type: 'citizen' });
    reportDao.createReport.mockResolvedValue(null);

    await expect(reportRepository.createReport(validData, false)).rejects.toThrow(
      /Unable to create report/i
    );
  });

  test("returns mapped report on success", async () => {
    jest.spyOn(userDao, 'getUserById').mockResolvedValue({ id: 1, type: 'citizen' });
    const daoRow = {
      reportId: 10,
      userId: 1,
      latitude: 45,
      longitude: 7,
      title: "Test Title",
      description: "Test Description",
      category: REPORT_CATEGORIES[0],
      status: REPORT_STATUSES.PENDING,
      rejection_reason: null,
      technical_office: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-02",
      image_path1: "p1.jpg",
      image_path2: null,
      image_path3: null,
      userUsername: "u",
      userName: "n",
      userSurname: "s",
      userEmail: "e@test.com",
    };

    reportDao.createReport.mockResolvedValue(daoRow);

    const result = await reportRepository.createReport(validData, false);

    expect(result).toEqual({
      id: 10,
      userId: 1,
      latitude: 45,
      longitude: 7,
      title: "Test Title",
      description: "Test Description",
      category: REPORT_CATEGORIES[0],
      status: REPORT_STATUSES.PENDING,
      rejection_reason: null,
      technical_office: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-02",
      photos: ["p1.jpg"],
      user: {
        id: 1,
        username: "u",
        name: "n",
        surname: "s",
        email: "e@test.com",
      },
    });
  });

  test("anonymous true forces null userId and maps", async () => {
    jest.spyOn(userDao, 'getUserById').mockResolvedValue({ id: 1, type: 'citizen' });
    const daoRow = {
      reportId: 99,
      userId: null,
      latitude: validData.latitude,
      longitude: validData.longitude,
      title: validData.title,
      description: validData.description,
      category: validData.category,
      status: REPORT_STATUSES.PENDING,
      rejection_reason: null,
      technical_office: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-02",
      image_path1: validData.photos[0],
      image_path2: null,
      image_path3: null,
      userUsername: "anon",
      userName: "Anon",
      userSurname: "User",
      userEmail: "anon@example.com",
    };
    reportDao.createReport.mockResolvedValue(daoRow);
    const result = await reportRepository.createReport({ ...validData }, true);
    expect(reportDao.createReport).toHaveBeenCalledWith(expect.objectContaining({ userId: null }));
    expect(result.userId).toBe(null);
  });

  test("throws UnauthorizedError when user is not a citizen", async () => {
    jest.spyOn(userDao, 'getUserById').mockResolvedValue({ id: 1, type: 'admin' });
    await expect(reportRepository.createReport(validData, false)).rejects.toThrow(/Only citizens can create reports/i);
  });

  test("latitude out of range throws", async () => {
    const d = { ...validData, latitude: 100 };
    await expect(reportRepository.createReport(d, false)).rejects.toThrow(/Latitude must be a number/i);
  });

  test("longitude out of range throws", async () => {
    const d = { ...validData, longitude: -190 };
    await expect(reportRepository.createReport(d, false)).rejects.toThrow(/Longitude must be a number/i);
  });

  test("description missing throws", async () => {
    const d = { ...validData, description: "   " };
    await expect(reportRepository.createReport(d, false)).rejects.toThrow(/Description is required/i);
  });

  test("description type invalid (left side of OR)", async () => {
    const d = { ...validData, description: 123 };
    await expect(reportRepository.createReport(d, false)).rejects.toThrow(/Description is required/i);
  });

  test("photos not array throws", async () => {
    const d = { ...validData, photos: "no" };
    await expect(reportRepository.createReport(d, false)).rejects.toThrow(/Photos must be an array/i);
  });

  test("empty photo string throws", async () => {
    const d = { ...validData, photos: [" "] };
    await expect(reportRepository.createReport(d, false)).rejects.toThrow(/Each photo must be a non-empty string/i);
  });

  test("photo non-string throws (left side of OR)", async () => {
    const d = { ...validData, photos: ["p1.jpg", 123] };
    await expect(reportRepository.createReport(d, false)).rejects.toThrow(/Each photo must be a non-empty string/i);
  });

  test("multi photos trimmed success", async () => {
    jest.spyOn(userDao, 'getUserById').mockResolvedValue({ id: 1, type: 'citizen' });
    const daoRow = {
      reportId: 11,
      userId: 1,
      latitude: 45,
      longitude: 7,
      title: "Test Title",
      description: "Test Description",
      category: REPORT_CATEGORIES[0],
      status: REPORT_STATUSES.PENDING,
      rejection_reason: null,
      technical_office: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-02",
      image_path1: "p1.jpg",
      image_path2: "p2.jpg",
      image_path3: "p3.jpg",
      userUsername: "u",
      userName: "n",
      userSurname: "s",
      userEmail: "e@test.com",
    };
    reportDao.createReport.mockResolvedValue(daoRow);
    const d = { ...validData, photos: [" p1.jpg ", "p2.jpg", "p3.jpg"] };
    const res = await reportRepository.createReport(d, false);
    expect(res.photos).toEqual(["p1.jpg", "p2.jpg", "p3.jpg"]);
  });

  test("dao throws propagates error (catch path)", async () => {
    jest.spyOn(userDao, 'getUserById').mockResolvedValue({ id: 1, type: 'citizen' });
    reportDao.createReport.mockRejectedValue(new Error("DB fail"));
    await expect(reportRepository.createReport(validData, false)).rejects.toThrow(/DB fail/);
  });
});

// ----------------------------------------------------
// getReportById
// ----------------------------------------------------
describe("reportRepository.getReportById", () => {
  test("throws if reportId missing", async () => {
    await expect(reportRepository.getReportById(undefined)).rejects.toThrow(
      /Report ID is required/i
    );
  });

  test("throws NotFound if dao returns null", async () => {
    reportDao.getReportById.mockResolvedValue(null);

    await expect(reportRepository.getReportById(1)).rejects.toThrow(NotFoundError);
  });

  test("returns mapped report", async () => {
    const daoRow = {
      reportId: 5,
      userId: 1,
      latitude: 10,
      longitude: 20,
      title: "T",
      description: "D",
      category: REPORT_CATEGORIES[0],
      status: REPORT_STATUSES.PENDING,
      rejection_reason: null,
      technical_office: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-02",
      image_path1: "a.jpg",
      image_path2: null,
      image_path3: null,
      userUsername: "u",
      userName: "n",
      userSurname: "s",
      userEmail: "e@test.com",
    };

    reportDao.getReportById.mockResolvedValue(daoRow);

    const res = await reportRepository.getReportById(5);

    expect(res.id).toBe(5);
    expect(res.photos).toEqual(["a.jpg"]);
  });
});

// ----------------------------------------------------
// reviewReport
// ----------------------------------------------------
describe("reportRepository.reviewReport", () => {
  const baseReport = {
    reportId: 1,
    userId: 1,
    latitude: 10,
    longitude: 20,
    title: "T",
    description: "D",
    category: REPORT_CATEGORIES[0],
    status: REPORT_STATUSES.PENDING,
    rejection_reason: null,
    technical_office: null,
    created_at: "2024-01-01",
    updated_at: "2024-01-02",
    image_path1: "x.jpg",
    userUsername: "u",
    userName: "n",
    userSurname: "s",
    userEmail: "e@test.com",
  };

  test("throws if reportId missing", async () => {
    await expect(reportRepository.reviewReport(null, {})).rejects.toThrow(
      /Report ID is required/i
    );
  });

  test("throws if status missing", async () => {
    await expect(reportRepository.reviewReport(1, {})).rejects.toThrow(
      /Status is required/i
    );
  });

  test("throws if report does not exist", async () => {
    reportDao.getReportById.mockResolvedValue(null);

    await expect(
      reportRepository.reviewReport(1, { status: "accepted" })
    ).rejects.toThrow(NotFoundError);
  });

  test("throws if report not pending", async () => {
    reportDao.getReportById.mockResolvedValue({ ...baseReport, status: REPORT_STATUSES.ASSIGNED });

    await expect(
      reportRepository.reviewReport(1, { status: "accepted" })
    ).rejects.toThrow(/Only pending reports can be reviewed/i);
  });

  test("reject requires explanation", async () => {
    reportDao.getReportById.mockResolvedValue(baseReport);

    await expect(
      reportRepository.reviewReport(1, { status: "rejected" })
    ).rejects.toThrow(/Explanation is required/i);
  });

  test("reject with blank explanation (right side of OR)", async () => {
    reportDao.getReportById.mockResolvedValue(baseReport);
    await expect(
      reportRepository.reviewReport(1, { status: "rejected", explanation: "   " })
    ).rejects.toThrow(/Explanation is required/i);
  });

  test("accept requires valid technical office", async () => {
    reportDao.getReportById.mockResolvedValue(baseReport);

    await expect(
      reportRepository.reviewReport(1, { status: "accepted", technicalOffice: "NOPE" })
    ).rejects.toThrow(/valid technical office/i);
  });

  test("accept path with non-string technicalOffice (left side of OR)", async () => {
    reportDao.getReportById.mockResolvedValue(baseReport);
    await expect(reportRepository.reviewReport(1, { status: "accepted", technicalOffice: 123 })).rejects.toThrow(/valid technical office/i);
  });

  test("successful reject returns mapped report", async () => {
    reportDao.getReportById.mockResolvedValue(baseReport);
    const updated = { ...baseReport, status: REPORT_STATUSES.REJECTED, rejection_reason: "bad" };
    reportDao.updateReportReview.mockResolvedValue(updated);

    const res = await reportRepository.reviewReport(1, {
      status: "rejected",
      explanation: "bad",
    });

    expect(res.status).toBeDefined();
  });

  test("invalid status value throws", async () => {
    reportDao.getReportById.mockResolvedValue(baseReport);
    await expect(reportRepository.reviewReport(1, { status: "weird" })).rejects.toThrow(/Status must be "accepted" or "rejected"/i);
  });

  test("status not string throws", async () => {
    await expect(reportRepository.reviewReport(1, { status: 123 })).rejects.toThrow(/Status is required/i);
  });

  test("accept path assigns officer", async () => {
    reportDao.getReportById.mockResolvedValue(baseReport);
    reportDao.getLeastLoadedOfficer = jest.fn().mockResolvedValue(99);
    const updated = { ...baseReport, status: REPORT_STATUSES.ASSIGNED, technical_office: TECHNICAL_OFFICER_ROLES[0] };
    reportDao.updateReportReview.mockResolvedValue(updated);
    const res = await reportRepository.reviewReport(1, { status: "accepted", technicalOffice: TECHNICAL_OFFICER_ROLES[0] });
    expect(reportDao.getLeastLoadedOfficer).toHaveBeenCalledWith(TECHNICAL_OFFICER_ROLES[0]);
    expect(reportDao.updateReportReview).toHaveBeenCalledWith(1, expect.objectContaining({ officerId: 99 }));
    expect(res.status).toBe(REPORT_STATUSES.ASSIGNED);
  });

  test("accept path no officer found throws", async () => {
    reportDao.getReportById.mockResolvedValue(baseReport);
    reportDao.getLeastLoadedOfficer = jest.fn().mockResolvedValue(null);
    await expect(reportRepository.reviewReport(1, { status: "accepted", technicalOffice: TECHNICAL_OFFICER_ROLES[0] })).rejects.toThrow(/No workers found/i);
  });

  test("update returns null triggers NotFound", async () => {
    reportDao.getReportById.mockResolvedValue(baseReport);
    reportDao.getLeastLoadedOfficer = jest.fn().mockResolvedValue(50);
    reportDao.updateReportReview.mockResolvedValue(null);
    await expect(reportRepository.reviewReport(1, { status: "accepted", technicalOffice: TECHNICAL_OFFICER_ROLES[0] })).rejects.toThrow(NotFoundError);
  });
});

// ----------------------------------------------------
// getReportsByStatus / helpers
// ----------------------------------------------------
describe("reportRepository.getReportsByStatus and helpers", () => {
  const daoRow = {
    reportId: 20,
    userId: 2,
    latitude: 1,
    longitude: 2,
    title: "A",
    description: "B",
    category: REPORT_CATEGORIES[0],
    status: REPORT_STATUSES.PENDING,
    rejection_reason: null,
    technical_office: null,
    created_at: "2024-01-01",
    updated_at: "2024-01-02",
    image_path1: "a.jpg",
    image_path2: null,
    image_path3: null,
    userUsername: "u2",
    userName: "n2",
    userSurname: "s2",
    userEmail: "u2@test.com",
  };

  test("invalid status filter throws", async () => {
    await expect(reportRepository.getReportsByStatus("wrong"))
      .rejects.toThrow(/Invalid status filter/i);
  });

  test("status not string throws", async () => {
    await expect(reportRepository.getReportsByStatus(123)).rejects.toThrow(/Status is required/i);
  });

  test("success maps rows and forwards options", async () => {
    reportDao.getReportsByStatus.mockResolvedValue([daoRow]);
    const opts = { boundingBox: { north: 1, south: 0, east: 2, west: -1 } };
    const res = await reportRepository.getReportsByStatus("pending", opts);
    expect(reportDao.getReportsByStatus).toHaveBeenCalledWith("pending", opts);
    expect(res[0].id).toBe(20);
  });

  test("dao error propagates", async () => {
    reportDao.getReportsByStatus.mockRejectedValue(new Error("DAO boom"));
    await expect(reportRepository.getReportsByStatus("pending")).rejects.toThrow(/DAO boom/);
  });

  test("getPendingReports uses pending", async () => {
    reportDao.getReportsByStatus.mockResolvedValue([daoRow]);
    const res = await reportRepository.getPendingReports();
    expect(reportDao.getReportsByStatus).toHaveBeenCalledWith(REPORT_STATUSES.PENDING, {});
    expect(res.length).toBe(1);
  });

  test("getApprovedReports uses assigned", async () => {
    reportDao.getReportsByStatus.mockResolvedValue([daoRow]);
    const opt = { boundingBox: { north: 1 } };
    const res = await reportRepository.getApprovedReports(opt);
    expect(reportDao.getReportsByStatus).toHaveBeenCalledWith(REPORT_STATUSES.ASSIGNED, opt);
    expect(res[0].status).toBe(REPORT_STATUSES.PENDING); // original row status preserved
  });
});

// ----------------------------------------------------
// getAssignedReports
// ----------------------------------------------------
describe("reportRepository.getAssignedReports", () => {
  test("invalid officerId throws", async () => {
    await expect(reportRepository.getAssignedReports(undefined)).rejects.toThrow(/Officer ID is required/i);
  });

  test("non-integer officerId throws", async () => {
    await expect(reportRepository.getAssignedReports("123")).rejects.toThrow(/Officer ID must be a valid integer/i);
  });

  test("success maps", async () => {
    const row = {
      reportId: 30,
      userId: 3,
      latitude: 1,
      longitude: 2,
      title: "A",
      description: "B",
      category: REPORT_CATEGORIES[0],
      status: REPORT_STATUSES.ASSIGNED,
      rejection_reason: null,
      technical_office: TECHNICAL_OFFICER_ROLES[0],
      created_at: "2024-01-01",
      updated_at: "2024-01-02",
      image_path1: "z.jpg",
      image_path2: null,
      image_path3: null,
      userUsername: "u3",
      userName: "n3",
      userSurname: "s3",
      userEmail: "u3@test.com",
    };
    reportDao.getReportsByOfficerId = jest.fn().mockResolvedValue([row]);
    const res = await reportRepository.getAssignedReports(42);
    expect(reportDao.getReportsByOfficerId).toHaveBeenCalledWith(42);
    expect(res[0].technical_office).toBe(TECHNICAL_OFFICER_ROLES[0]);
  });

  test("dao error propagates", async () => {
    reportDao.getReportsByOfficerId = jest.fn().mockRejectedValue(new Error("Officer fail"));
    await expect(reportRepository.getAssignedReports(42)).rejects.toThrow(/Officer fail/);
  });
});

// ----------------------------------------------------
// getCitizenReports
// ----------------------------------------------------
describe("reportRepository.getCitizenReports", () => {
  test("maps rows via mapReportRow", async () => {
    const row = {
      reportId: 101,
      userId: 7,
      latitude: 10,
      longitude: 20,
      title: "T",
      description: "D",
      category: REPORT_CATEGORIES[0],
      status: REPORT_STATUSES.PENDING,
      rejection_reason: null,
      technical_office: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-02",
      image_path1: "a.jpg",
      image_path2: null,
      image_path3: null,
      userUsername: "u",
      userName: "n",
      userSurname: "s",
      userEmail: "e@test.com",
    };
    reportDao.getCitizenReports = jest.fn().mockResolvedValue([row]);
    const res = await reportRepository.getCitizenReports({});
    expect(reportDao.getCitizenReports).toHaveBeenCalledWith({});
    expect(res[0]).toMatchObject({ id: 101, userId: 7, photos: ["a.jpg"] });
  });
});

// ----------------------------------------------------
// assignReportToExternalMaintainer
// ----------------------------------------------------
describe("reportRepository.assignReportToExternalMaintainer", () => {
  test("invalid ids throw", async () => {
    await expect(
      require('../../server/repository/reportRepository').assignReportToExternalMaintainer(0, 2, 3)
    ).rejects.toThrow(/Report ID is required|Invalid report ID/i);
  });

  test("non-integer reportId throws", async () => {
    await expect(
      require('../../server/repository/reportRepository').assignReportToExternalMaintainer('1', 2, 3)
    ).rejects.toThrow(/valid integer/i);
  });

  test("missing externalMaintainerId throws", async () => {
    await expect(
      require('../../server/repository/reportRepository').assignReportToExternalMaintainer(1, undefined, 3)
    ).rejects.toThrow(/External maintainer ID is required/i);
  });

  test("non-integer externalMaintainerId throws", async () => {
    await expect(
      require('../../server/repository/reportRepository').assignReportToExternalMaintainer(1, '2', 3)
    ).rejects.toThrow(/valid integer/i);
  });

  test("report not found throws", async () => {
    jest.isolateModules(() => {
      jest.resetModules();
      jest.doMock('../../server/dao/reportDao', () => ({
        getReportById: jest.fn().mockResolvedValue(null),
      }));
      const repo = require('../../server/repository/reportRepository');
      return expect(repo.assignReportToExternalMaintainer(1, 2, 3)).rejects.toThrow(/Report not found/i);
    });
  });

  test("report not assigned throws", async () => {
    jest.isolateModules(() => {
      jest.resetModules();
      jest.doMock('../../server/dao/reportDao', () => ({
        getReportById: jest.fn().mockResolvedValue({ status: REPORT_STATUSES.PENDING }),
      }));
      const repo = require('../../server/repository/reportRepository');
      return expect(repo.assignReportToExternalMaintainer(1, 2, 3)).rejects.toThrow(/Only assigned reports/i);
    });
  });

  test("wrong officer throws Unauthorized", async () => {
    jest.isolateModules(() => {
      jest.resetModules();
      jest.doMock('../../server/dao/reportDao', () => ({
        getReportById: jest.fn().mockResolvedValue({ status: REPORT_STATUSES.ASSIGNED, officerId: 99 }),
      }));
      const repo = require('../../server/repository/reportRepository');
      return expect(repo.assignReportToExternalMaintainer(1, 2, 3)).rejects.toThrow(/assigned to you/i);
    });
  });

  test("maintainer not found or wrong type throws", async () => {
    jest.isolateModules(() => {
      jest.resetModules();
      jest.doMock('../../server/dao/reportDao', () => ({
        getReportById: jest.fn().mockResolvedValue({ status: REPORT_STATUSES.ASSIGNED, officerId: 3 }),
      }));
      jest.doMock('../../server/dao/userDao', () => ({
        getUserById: jest.fn().mockResolvedValue(null),
      }));
      const repo1 = require('../../server/repository/reportRepository');
      expect(repo1.assignReportToExternalMaintainer(1, 2, 3)).rejects.toThrow(/External maintainer not found/i);

      // Reset modules to ensure next require picks up the new userDao mock
      jest.resetModules();
      jest.doMock('../../server/dao/userDao', () => ({
        getUserById: jest.fn().mockResolvedValue({ id: 2, type: 'citizen' }),
      }));
      const repo2 = require('../../server/repository/reportRepository');
      return expect(repo2.assignReportToExternalMaintainer(1, 2, 3)).rejects.toThrow(/not an external maintainer/i);
    });
  });

  test("update null throws NotFound", async () => {
    jest.isolateModules(() => {
      jest.resetModules();
      jest.doMock('../../server/dao/reportDao', () => ({
        getReportById: jest.fn().mockResolvedValue({ status: REPORT_STATUSES.ASSIGNED, officerId: 3 }),
        assignReportToExternalMaintainer: jest.fn().mockResolvedValueOnce(null),
      }));
      jest.doMock('../../server/dao/userDao', () => ({
        getUserById: jest.fn().mockResolvedValue({ id: 2, type: 'external_mantainer' }),
      }));
      const repo = require('../../server/repository/reportRepository');
      return expect(repo.assignReportToExternalMaintainer(1, 2, 3)).rejects.toThrow(/Report not found/i);
    });
  });

  test("success maps row", async () => {
    jest.isolateModules(async () => {
      jest.resetModules();
      const daoRow = { reportId: 55, userId: 1, latitude: 1, longitude: 2, title: 't', description: 'd', category: REPORT_CATEGORIES[0], status: REPORT_STATUSES.ASSIGNED, rejection_reason: null, technical_office: TECHNICAL_OFFICER_ROLES[0], created_at: '2024-01-01', updated_at: '2024-01-02', image_path1: 'a.jpg', image_path2: null, image_path3: null, userUsername: 'u', userName: 'n', userSurname: 's', userEmail: 'e@test.com' };
      jest.doMock('../../server/dao/reportDao', () => ({
        getReportById: jest.fn().mockResolvedValue({ status: REPORT_STATUSES.ASSIGNED, officerId: 3 }),
        assignReportToExternalMaintainer: jest.fn().mockResolvedValueOnce(daoRow),
      }));
      jest.doMock('../../server/dao/userDao', () => ({
        getUserById: jest.fn().mockResolvedValue({ id: 2, type: 'external_mantainer' }),
      }));
      const repo2 = require('../../server/repository/reportRepository');
      const res = await repo2.assignReportToExternalMaintainer(1, 2, 3);
      expect(res.id).toBe(55);
      expect(res.photos).toEqual(['a.jpg']);
    });
  });
});

// ----------------------------------------------------
// updateMaintainerStatus
// ----------------------------------------------------
describe("reportRepository.updateMaintainerStatus", () => {
  test("invalid input throws", async () => {
    await expect(
      require('../../server/repository/reportRepository').updateMaintainerStatus(0, 2, REPORT_STATUSES.PROGRESS)
    ).rejects.toThrow(/Invalid report ID|Maintainer ID is required/i);
  });

  test("invalid status value throws BadRequest", async () => {
    await expect(
      require('../../server/repository/reportRepository').updateMaintainerStatus(1, 2, 'not_allowed')
    ).rejects.toThrow(/Invalid status/i);
  });

  test("status not a string throws", async () => {
    await expect(
      require('../../server/repository/reportRepository').updateMaintainerStatus(1, 2, null)
    ).rejects.toThrow(/Status is required/i);
  });

  test("missing maintainerId triggers Unauthorized branch", async () => {
    await expect(
      require('../../server/repository/reportRepository').updateMaintainerStatus(5, undefined, REPORT_STATUSES.PROGRESS)
    ).rejects.toThrow(/Maintainer ID is required/i);
  });

  test("update null with missing report yields NotFound, else Unauthorized", async () => {
    jest.isolateModules(() => {
      jest.resetModules();
      jest.doMock('../../server/dao/reportDao', () => ({
        updateReportStatusByOfficer: jest.fn().mockResolvedValueOnce(null),
        getReportById: jest.fn().mockResolvedValueOnce(null),
      }));
      const repo1 = require('../../server/repository/reportRepository');
      expect(repo1.updateMaintainerStatus(1, 2, REPORT_STATUSES.PROGRESS)).rejects.toThrow(/Report not found/i);

      jest.resetModules();
      jest.doMock('../../server/dao/reportDao', () => ({
        updateReportStatusByOfficer: jest.fn().mockResolvedValueOnce(null),
        getReportById: jest.fn().mockResolvedValueOnce({ reportId: 1 }),
      }));
      const repo2 = require('../../server/repository/reportRepository');
      return expect(repo2.updateMaintainerStatus(1, 2, REPORT_STATUSES.PROGRESS)).rejects.toThrow(/not assigned/i);
    });
  });

  test("success maps updated row", async () => {
    jest.isolateModules(async () => {
      jest.resetModules();
      const daoRow = { reportId: 55, userId: 1, latitude: 1, longitude: 2, title: 't', description: 'd', category: REPORT_CATEGORIES[0], status: REPORT_STATUSES.PROGRESS, rejection_reason: null, technical_office: TECHNICAL_OFFICER_ROLES[0], created_at: '2024-01-01', updated_at: '2024-01-02', image_path1: 'a.jpg', image_path2: null, image_path3: null, userUsername: 'u', userName: 'n', userSurname: 's', userEmail: 'e@test.com' };
      jest.doMock('../../server/dao/reportDao', () => ({
        updateReportStatusByOfficer: jest.fn().mockResolvedValueOnce(daoRow),
      }));
      const repo = require('../../server/repository/reportRepository');
      const res = await repo.updateMaintainerStatus(1, 2, REPORT_STATUSES.PROGRESS);
      expect(res.id).toBe(55);
      expect(res.status).toBe(REPORT_STATUSES.PROGRESS);
    });
  });
});