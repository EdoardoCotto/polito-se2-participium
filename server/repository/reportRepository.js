const reportDao = require('../dao/reportDao');
const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');
const { REPORT_CATEGORIES } = require('../constants/reportCategories');

/**
 * Create a new report with location
 * @param {{ userId: number, latitude: number, longitude: number, title: string, description: string, category: string, photos: string[] }} reportData
 * @returns {Promise<Object>}
 */
exports.createReport = async (reportData) => {
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

    if (!userId || latitude === undefined || longitude === undefined) {
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

    const photosFromDb = [
      result.image_path1,
      result.image_path2,
      result.image_path3,
    ].filter(Boolean);

    return {
      id: result.id,
      userId: result.userId,
      latitude: result.latitude,
      longitude: result.longitude,
      title: result.title,
      description: result.description,
      category: result.category,
      status: result.status,
      created_at: result.created_at,
      updated_at: result.updated_at,
      photos: photosFromDb,
    };
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
    const photosFromDb = [
      report.image_path1,
      report.image_path2,
      report.image_path3,
    ].filter(Boolean);

    return {
      id: report.id,
      userId: report.userId,
      latitude: report.latitude,
      longitude: report.longitude,
      title: report.title,
      description: report.description,
      category: report.category,
      status: report.status,
      created_at: report.created_at,
      updated_at: report.updated_at,
      photos: photosFromDb,
    };
  } catch (err) {
    throw err;
  }
};


