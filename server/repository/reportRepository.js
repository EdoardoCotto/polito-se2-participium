const reportDao = require('../dao/reportDao');
const userDao = require('../dao/userDao');
const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');
const UnauthorizedError = require('../errors/UnauthorizedError');
const { REPORT_CATEGORIES } = require('../constants/reportCategories');
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
exports.createReport = async (reportData, anonymous) => {
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

    if (!anonymous && userId == null){
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

    const user = await userDao.getUserById(userId);
    if (user.type != 'citizen') {
      throw new UnauthorizedError('Only citizens can create reports');
    }

    const result = await reportDao.createReport({
      userId: anonymous ? null : userId,
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
  if (!reportId) {
    throw new BadRequestError('Report ID is required');
  }
  const report = await reportDao.getReportById(reportId);
  if (!report) {
    throw new NotFoundError('Report not found');
  }

  return mapReportRow(report);
};

/**
 * Process review data based on status (rejection or assignment)
 * @param {string} normalizedStatus
 * @param {string} explanation
 * @param {string} technicalOffice
 * @returns {Promise<{ rejectionReason: string|null, technicalOfficeValue: string|null, assignedOfficerId: number|null }>}
 */
const processReviewData = async (normalizedStatus, explanation, technicalOffice) => {
  if (normalizedStatus === REPORT_STATUSES.REJECTED) {
    if (typeof explanation !== 'string' || !explanation.trim()) {
      throw new BadRequestError('Explanation is required when rejecting a report');
    }
    return {
      rejectionReason: explanation.trim(),
      technicalOfficeValue: null,
      assignedOfficerId: null,
    };
  }

  if (typeof technicalOffice !== 'string' || !TECHNICAL_OFFICER_ROLES.includes(technicalOffice)) {
    throw new BadRequestError('A valid technical office is required when accepting a report');
  }

  const assignedOfficerId = await reportDao.getLeastLoadedOfficer(technicalOffice);
  if (!assignedOfficerId) {
    throw new BadRequestError(`No workers found for role: ${technicalOffice}. Cannot assign report.`);
  }

  return {
    rejectionReason: null,
    technicalOfficeValue: technicalOffice,
    assignedOfficerId,
  };
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

    let normalizedStatus = status.toLowerCase().trim();
    if (REPORT_STATUSES.ACCEPTED.includes(normalizedStatus)) {
      normalizedStatus = REPORT_STATUSES.ASSIGNED;
    }

    if (![REPORT_STATUSES.ASSIGNED, REPORT_STATUSES.REJECTED].includes(normalizedStatus)) {
      throw new BadRequestError('Status must be "accepted" or "rejected"');
    }

    // Controllo esistenza report e stato
    const existing = await reportDao.getReportById(reportId);
    if (!existing) {
      throw new NotFoundError('Report not found');
    }
    if (existing.status !== REPORT_STATUSES.PENDING) {
      throw new BadRequestError('Only pending reports can be reviewed');
    }

    const { rejectionReason, technicalOfficeValue, assignedOfficerId } = await processReviewData(
      normalizedStatus,
      explanation,
      technicalOffice
    );

    // Eseguiamo l'update passando anche l'officerId trovato
    const updated = await reportDao.updateReportReview(reportId, {
      status: normalizedStatus,
      rejectionReason,
      technicalOffice: technicalOfficeValue,
      officerId: assignedOfficerId
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

   

const getReportsByStatusInternal = async (status, options = {}) => {
  if (typeof status !== 'string') {
    throw new BadRequestError('Status is required');
  }

  const normalized = status.toLowerCase().trim();
  const allowed = [
    REPORT_STATUSES.PENDING,
    REPORT_STATUSES.ACCEPTED,
    REPORT_STATUSES.REJECTED,
    REPORT_STATUSES.ASSIGNED,
  ];

  if (!allowed.includes(normalized)) {
    throw new BadRequestError('Invalid status filter');
  }

  const rows = await reportDao.getReportsByStatus(normalized, options);
  return rows.map(mapReportRow);
};

/**
 * Get reports by status (helper generale)
 */
exports.getReportsByStatus = async (status, options = {}) => {
  return await getReportsByStatusInternal(status, options);
};

/**
 * Get pending reports (per il municipal public relations officer)
 */
exports.getPendingReports = async () => {
  return getReportsByStatusInternal(REPORT_STATUSES.PENDING);
};

/**
 * Get approved (accepted) reports for the public map
 * @param {{ boundingBox?: { north: number, south: number, east: number, west: number } }} options
 */
exports.getApprovedReports = async (options = {}) => {
  return getReportsByStatusInternal(REPORT_STATUSES.ASSIGNED, options);
};

exports.getCitizenReports = async (options = {}) => {
  const rows = await reportDao.getCitizenReports(options);
  return rows.map(mapReportRow);
};
/**
 * Get reports assigned to a technical office staff member
 * @param {number} officerId
 * @returns {Promise<Object[]>}
 */
exports.getAssignedReports = async (officerId) => {
  if (!officerId) {
    throw new BadRequestError('Officer ID is required');
  }

  if (!Number.isInteger(officerId)) {
    throw new BadRequestError('Officer ID must be a valid integer');
  }

  const rows = await reportDao.getReportsByOfficerId(officerId);
  return rows.map(mapReportRow);
};

/**
 * Assign a report to an external maintainer
 * @param {number} reportId
 * @param {number} externalMaintainerId
 * @param {number} technicalOfficeStaffId - ID of the technical office staff member making the assignment
 * @returns {Promise<Object>}
 */
exports.assignReportToExternalMaintainer = async (reportId, externalMaintainerId, technicalOfficeStaffId) => {
  if (!reportId) {
    throw new BadRequestError('Report ID is required');
  }
  if (!Number.isInteger(reportId)) {
    throw new BadRequestError('Report ID must be a valid integer');
  }
  if (!externalMaintainerId) {
    throw new BadRequestError('External maintainer ID is required');
  }
  if (!Number.isInteger(externalMaintainerId)) {
    throw new BadRequestError('External maintainer ID must be a valid integer');
  }

  // Verify the report exists and is assigned to the technical office staff member
  const report = await reportDao.getReportById(reportId);
  if (!report) {
    throw new NotFoundError('Report not found');
  }

  // Check if report is in assigned status
  if (report.status !== REPORT_STATUSES.ASSIGNED) {
    throw new BadRequestError('Only assigned reports can be assigned to external maintainers');
  }

  // Verify the report is assigned to the requesting technical office staff member
  if (report.officerId !== technicalOfficeStaffId) {
    throw new UnauthorizedError('You can only assign reports that are assigned to you');
  }

  // Verify the external maintainer exists and is actually an external maintainer
  const maintainer = await userDao.getUserById(externalMaintainerId);
  if (!maintainer) {
    throw new NotFoundError('External maintainer not found');
  }
  if (maintainer.type !== 'external_mantainer') {
    throw new BadRequestError('The specified user is not an external maintainer');
  }

  // Assign the report to the external maintainer
  const updated = await reportDao.assignReportToExternalMaintainer(reportId, externalMaintainerId);
  if (!updated) {
    throw new NotFoundError('Report not found');
  }

  return mapReportRow(updated);
};

/**
 * Update the status of a report assigned to an external maintainer
 * @param {number} reportId
 * @param {number} maintainerId
 * @param {string} newStatus
 * @returns {Promise<Object>}
 */
exports.updateMaintainerStatus = async (reportId, maintainerId, newStatus) => {
  if (!reportId || !Number.isInteger(reportId)) {
    throw new BadRequestError('Invalid report ID');
  }
  if (!maintainerId) {
    throw new UnauthorizedError('Maintainer ID is required');
  }

  // Validazione dello stato
  if (typeof newStatus !== 'string') {
    throw new BadRequestError('Status is required');
  }

  const normalizedStatus = newStatus.toLowerCase().trim();
  
  // Stati permessi per il manutentore secondo il ciclo di vita 
  // Pending e Rejected sono gestiti dall'Organization Office [cite: 24]
  const ALLOWED_STATUSES = [
    REPORT_STATUSES.PROGRESS, // [cite: 27]
    REPORT_STATUSES.SUSPENDED,   // [cite: 28]
    REPORT_STATUSES.RESOLVED     // [cite: 29]
  ];

  if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
    throw new BadRequestError(`Invalid status. Allowed statuses for maintainers are: ${ALLOWED_STATUSES.join(', ')}`);
  }

  // Eseguiamo l'aggiornamento
  const updated = await reportDao.updateReportStatusByOfficer(reportId, maintainerId, normalizedStatus);

  if (!updated) {
    // Se è null, potrebbe essere che il report non esiste o non è assegnato a questo utente.
    // Per sicurezza controlliamo se esiste il report per dare l'errore giusto.
    const reportExists = await reportDao.getReportById(reportId);
    if (!reportExists) {
      throw new NotFoundError('Report not found');
    }
    // Se esiste ma l'update ha fallito, significa che l'officerId non corrispondeva
    throw new UnauthorizedError('You are not assigned to this report');
  }

  return mapReportRow(updated);
};