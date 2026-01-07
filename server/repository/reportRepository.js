const reportDao = require('../dao/reportDao');
const userDao = require('../dao/userDao');
const notificationService = require('../services/notificationService');
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
    id: row.reportId,
    userId: row.userId,
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
    
    // Dati del cittadino
    user: {
      id: row.userId,
      username: row.userUsername,
      name: row.userName,
      surname: row.userSurname,
      email: row.userEmail,
    },

    // Se la query ha restituito dati del Manutentore (usato quando guarda l'Officer)
    externalMaintainer: row.maintainerId ? {
      id: row.maintainerId,
      username: row.maintainerUsername,
      name: row.maintainerName,
      surname: row.maintainerSurname,
      email: row.maintainerEmail,
    } : null,

    // Se la query ha restituito dati dell'Officer (usato quando guarda il Manutentore)
    officer: row.officerId ? {
      id: row.officerId,
      username: row.officerUsername,
      name: row.officerName,
      surname: row.officerSurname,
      email: row.officerEmail,
    } : null,
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

    // For non-anonymous reports, userId is required
    if (!anonymous && userId == null) {
      throw new BadRequestError('User ID is required for non-anonymous reports');
    }
    // Latitude and longitude are always required
    if (latitude === undefined || longitude === undefined) {
      throw new BadRequestError('Latitude and longitude are required');
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

    // Only check user type if not anonymous
    if (!anonymous && userId != null) {
      const user = await userDao.getUserById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      if (user.type != 'citizen') {
        throw new UnauthorizedError('Only citizens can create reports');
      }
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

    // When creating a report, DAO returns a row with 'id', but mapReportRow expects 'reportId'
    // So we need to map it correctly
    const mappedRow = {
      ...result,
      reportId: result.id,
      userId: result.userId,
      // Add default user fields if not present (for anonymous reports)
      userUsername: null,
      userName: null,
      userSurname: null,
      userEmail: null
    };

    return mapReportRow(mappedRow);
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

  // Map the raw DB row to match mapReportRow expectations
  const mappedRow = {
    ...report,
    reportId: report.id,  // Add reportId from id
    userId: report.userId,
    userUsername: null,
    userName: null,
    userSurname: null,
    userEmail: null
  };

  return mapReportRow(mappedRow);
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

    // Store old status for notification
    const oldStatus = existing.status;

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

    // Create notification for status change (async, don't wait)
    notificationService.createStatusChangeNotification(
      reportId,
      normalizedStatus,
      oldStatus,
      rejectionReason
    ).catch(err => {
      console.error('Error creating notification in reviewReport:', err);
    });

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
  console.log('Rows fetched for officer:', rows);
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
  const isExternalMaintainer =
    maintainer?.type === 'external_maintainer' ||
    (Array.isArray(maintainer.roles) && maintainer.roles.includes('external_maintainer'));
  if (!isExternalMaintainer) {
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
exports.updateMaintainerStatus = async (reportId, userId, newStatus) => {
  if (!reportId || !Number.isInteger(reportId)) {
    throw new BadRequestError('Invalid report ID');
  }
  if (!userId) {
    throw new UnauthorizedError('User ID is required');
  }

  if (typeof newStatus !== 'string') {
    throw new BadRequestError('Status is required');
  }

  const normalizedStatus = newStatus.toLowerCase().trim();
  
  // Stati permessi per chi lavora sul ticket (sia officer che maintainer)
  const ALLOWED_STATUSES = [
    'progress',
    'suspended',
    'resolved'
  ];

  if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
    throw new BadRequestError(`Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}`);
  }

  // Recupero vecchio stato (opzionale, per notifiche)
  let oldStatus = null;
  try {
    const currentReport = await reportDao.getReportById(reportId);
    if (currentReport) {
      oldStatus = currentReport.status;
    }
  } catch (_e) {
    // Ignora errori qui
  }

  // CHIAMATA AL NUOVO METODO DAO (passiamo userId generico)
  const updatedRow = await reportDao.updateReportStatusByAssignee(reportId, userId, normalizedStatus);

  if (!updatedRow) {
    const reportExists = await reportDao.getReportById(reportId);
    if (!reportExists) {
      throw new NotFoundError('Report not found');
    }
    // Errore generico: non sei assegnato (nè come officer, nè come maintainer)
    throw new UnauthorizedError('You are not assigned to this report (neither as Officer nor External Maintainer)');
  }

  // Notifiche
  notificationService.createStatusChangeNotification(
    reportId,
    normalizedStatus,
    oldStatus,
    null
  ).catch(err => {
    console.error('Error creating notification:', err);
  });

  return mapReportRow(updatedRow);
};
/**
 * Get reports assigned to an external maintainer
 * @param {number} maintainerId
 * @returns {Promise<Object[]>}
 */
exports.getAssignedReportsForExternal = async (maintainerId) => {
  if (!maintainerId) {
    throw new BadRequestError('Maintainer ID is required');
  }

  if (!Number.isInteger(maintainerId)) {
    throw new BadRequestError('Maintainer ID must be a valid integer');
  }

  // Chiamata al nuovo metodo DAO
  const rows = await reportDao.getReportsByExternalMaintainerId(maintainerId);
  console.log('Rows fetched for external maintainer:', rows);
  
  // Riutilizziamo la stessa funzione mapReportRow aggiornata
  return rows.map(mapReportRow);
};

/**
 * Get all reports for a specific user
 * @param {number} userId
 * @returns {Promise<Object[]>}
 */
exports.getUserReports = async (userId) => {
  if (!userId) {
    throw new BadRequestError('User ID is required');
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new BadRequestError('User ID must be a valid positive integer');
  }

  const rows = await reportDao.getReportsByUserId(userId);
  return rows.map(mapReportRow);
};