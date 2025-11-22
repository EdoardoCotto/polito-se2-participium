const reportDao = require('../dao/reportDao');
const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');
const { REPORT_CATEGORIES } = require('../constants/reportCategories');
// const { CATEGORY_TO_OFFICE } = require('../constants/categoryToOfficeMap');
const { TECHNICAL_OFFICER_ROLES } = require('../constants/roles');
const REPORT_STATUSES = require('../constants/reportStatus');

/**
 * Helper: mappa una row del DB nell'oggetto restituito dalle API
 */
const mapReportRow = (row) => {
  const photosFromDb = [
    row.image_path1,
    row.image_path2,
    row.image_path3,
  ].filter(Boolean);

  return {
    id: row.reportId,           // ⬅ report
    userId: row.userId,         // ⬅ utente (dalla join)
    latitude: row.latitude,
    longitude: row.longitude,
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status,
    rejection_reason: row.rejection_reason || null,
    technical_office: row.technical_office || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    photos: photosFromDb,
    user: {
      id: row.userId,
      username: row.userUsername,
      name: row.userName,
      surname: row.userSurname,
      email: row.userEmail,
    },
  };
};

/**
 * Create a new report with location
 * @param {{ userId: number, latitude: number, longitude: number, title: string, description: string, category: string, photos: string[] }} reportData
 * @returns {Promise<Object>}
 */
exports.createReport = async (reportData, anonymus) => {
  try {
    const {
      userId,
      latitude,
      longitude,
      title,
      description,
      category,
      photos,
    } = reportData || {};

    if (anonymus && userId != null){
      throw new BadRequestError('The Report is not anonymus')
    }
    if (!anonymus && userId == null){
      throw new BadRequestError('User ID, latitude, and longitude are required');
    }
    if (latitude === undefined || longitude === undefined) {
      throw new BadRequestError('User ID, latitude, and longitude are required');
    }

    // Validate latitude range (-90 to 90)
    if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
      throw new BadRequestError('Latitude must be a number between -90 and 90');
    }

    // Validate longitude range (-180 to 180)
    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
      throw new BadRequestError('Longitude must be a number between -180 and 180');
    }

    if (typeof title !== 'string' || title.trim().length === 0) {
      throw new BadRequestError('Title is required');
    }

    if (typeof description !== 'string' || description.trim().length === 0) {
      throw new BadRequestError('Description is required');
    }

    if (typeof category !== 'string' || !REPORT_CATEGORIES.includes(category)) {
      throw new BadRequestError('Category is invalid');
    }

    if (!Array.isArray(photos)) {
      throw new BadRequestError('Photos must be an array');
    }

    if (photos.length < 1 || photos.length > 3) {
      throw new BadRequestError('Photos array must contain between 1 and 3 items');
    }

    const trimmedPhotos = photos.map((photo) => {
      if (typeof photo !== 'string' || photo.trim().length === 0) {
        throw new BadRequestError('Each photo must be a non-empty string');
      }
      return photo.trim();
    });

    const result = await reportDao.createReport({
      userId,
      latitude,
      longitude,
      title: title.trim(),
      description: description.trim(),
      category,
      photos: trimmedPhotos,
    });
    if (!result) {
      throw new BadRequestError('Unable to create report');
    }

    return mapReportRow(result);
  } catch (err) {
    console.error('Error in createReport repository:', err);
    throw err;
  }
};

/**
 * Get report by ID
 * @param {number} reportId
 * @returns {Promise<Object>}
 */
exports.getReportById = async (reportId) => {
  try {
    if (!reportId) {
      throw new BadRequestError('Report ID is required');
    }
    const report = await reportDao.getReportById(reportId);
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    return mapReportRow(report);
  } catch (err) {
    throw err;
  }
};

/**
 * Review (accept or reject) a report
 * @param {number} reportId
 * @param {{ status: string, explanation?: string, technicalOffice?: string }} reviewData
 * @returns {Promise<Object>}
 */
exports.reviewReport = async (reportId, reviewData = {}) => {
  try {
    if (!reportId) {
      throw new BadRequestError('Report ID is required');
    }

    const { status, explanation, technicalOffice } = reviewData;

    if (typeof status !== 'string') {
      throw new BadRequestError('Status is required');
    }

    const normalizedStatus = status.toLowerCase().trim();

    if (![REPORT_STATUSES.ACCEPTED, REPORT_STATUSES.REJECTED].includes(normalizedStatus)) {
      throw new BadRequestError('Status must be "accepted" or "rejected"');
    }

    const existing = await reportDao.getReportById(reportId);
    if (!existing) {
      throw new NotFoundError('Report not found');
    }

    if (existing.status !== REPORT_STATUSES.PENDING) {
      throw new BadRequestError('Only pending reports can be reviewed');
    }

    let rejectionReason = null;
    let technicalOfficeValue = null;

    if (normalizedStatus === REPORT_STATUSES.REJECTED) {
      if (typeof explanation !== 'string' || !explanation.trim()) {
        throw new BadRequestError('Explanation is required when rejecting a report');
      }
      rejectionReason = explanation.trim();
      technicalOfficeValue = null; // rejected -> niente ufficio tecnico
    } else if (normalizedStatus === REPORT_STATUSES.ACCEPTED) {
      // check technicalOffice validity
      if (typeof technicalOffice !== 'string' || !TECHNICAL_OFFICER_ROLES.includes(technicalOffice)) {
        throw new BadRequestError('A valid technical office is required when accepting a report');
      }
      technicalOfficeValue = technicalOffice;
    }

    const updated = await reportDao.updateReportReview(reportId, {
      status: normalizedStatus,
      rejectionReason,
      technicalOffice: technicalOfficeValue,
    });

    if (!updated) {
      throw new NotFoundError('Report not found');
    }

    return mapReportRow(updated);
  } catch (err) {
    console.error('Error in reviewReport repository:', err);
    throw err;
  }
};

/**
 * Get reports by status (helper generale)
 */
exports.getReportsByStatus = async (status) => {
  try {
    if (typeof status !== 'string') {
      throw new BadRequestError('Status is required');
    }
    const normalized = status.toLowerCase().trim();
    const allowed = [
      REPORT_STATUSES.PENDING,
      REPORT_STATUSES.ACCEPTED,
      REPORT_STATUSES.REJECTED,
    ];
    if (!allowed.includes(normalized)) {
      throw new BadRequestError('Invalid status filter');
    }

    const rows = await reportDao.getReportsByStatus(normalized);
    return rows.map(mapReportRow);
  } catch (err) {
    throw err;
  }
};

/**
 * Get pending reports (per il municipal public relations officer)
 */
exports.getPendingReports = async () => {
  return exports.getReportsByStatus(REPORT_STATUSES.PENDING);
};
