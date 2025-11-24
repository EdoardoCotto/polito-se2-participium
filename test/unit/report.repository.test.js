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
});