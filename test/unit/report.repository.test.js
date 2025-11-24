// report.repository.test.js
// Fully updated unit tests with mocks for reportDao, coherent with your repository

const reportRepository = require("../../server/repository/reportRepository");
const reportDao = require("../../server/dao/reportDao");
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

  test("throws if title is invalid", async () => {
    const data = { ...validData, title: "  " };

    await expect(reportRepository.createReport(data, false)).rejects.toThrow(
      /Title is required/i
    );
  });

  test("throws if category invalid", async () => {
    const data = { ...validData, category: "NOPE" };

    await expect(reportRepository.createReport(data, false)).rejects.toThrow(
      /Category is invalid/i
    );
  });

  test("throws if photos array length invalid", async () => {
    const data = { ...validData, photos: [] };

    await expect(reportRepository.createReport(data, false)).rejects.toThrow(
      /Photos array must contain between 1 and 3 items/i
    );
  });

  test("throws if dao returns null", async () => {
    reportDao.createReport.mockResolvedValue(null);

    await expect(reportRepository.createReport(validData, false)).rejects.toThrow(
      /Unable to create report/i
    );
  });

  test("returns mapped report on success", async () => {
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

  test("anonymous with userId present throws", async () => {
    await expect(reportRepository.createReport({ ...validData }, true)).rejects.toThrow(/not anonymus/i);
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

  test("photos not array throws", async () => {
    const d = { ...validData, photos: "no" };
    await expect(reportRepository.createReport(d, false)).rejects.toThrow(/Photos must be an array/i);
  });

  test("empty photo string throws", async () => {
    const d = { ...validData, photos: [" "] };
    await expect(reportRepository.createReport(d, false)).rejects.toThrow(/Each photo must be a non-empty string/i);
  });

  test("multi photos trimmed success", async () => {
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

  test("accept requires valid technical office", async () => {
    reportDao.getReportById.mockResolvedValue(baseReport);

    await expect(
      reportRepository.reviewReport(1, { status: "accepted", technicalOffice: "NOPE" })
    ).rejects.toThrow(/valid technical office/i);
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
  test("invalid technicalOffice throws", async () => {
    await expect(reportRepository.getAssignedReports(" ")).rejects.toThrow(/Technical office is required/i);
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
    reportDao.getReportsByTechnicalOffice = jest.fn().mockResolvedValue([row]);
    const res = await reportRepository.getAssignedReports(TECHNICAL_OFFICER_ROLES[0]);
    expect(reportDao.getReportsByTechnicalOffice).toHaveBeenCalledWith(TECHNICAL_OFFICER_ROLES[0]);
    expect(res[0].technical_office).toBe(TECHNICAL_OFFICER_ROLES[0]);
  });

  test("dao error propagates", async () => {
    reportDao.getReportsByTechnicalOffice = jest.fn().mockRejectedValue(new Error("Tech office fail"));
    await expect(reportRepository.getAssignedReports(TECHNICAL_OFFICER_ROLES[0])).rejects.toThrow(/Tech office fail/);
  });
});