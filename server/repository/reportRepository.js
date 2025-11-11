const reportDao = require('../dao/reportDao');
const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');

/**
 * Create a new report with location
 * @param {{ userId: number, latitude: number, longitude: number }} reportData
 * @returns {Promise<Object>}
 */
exports.createReport = async (reportData) => {
  try {
    if (!reportData.userId || reportData.latitude === undefined || reportData.longitude === undefined) {
      throw new BadRequestError('User ID, latitude, and longitude are required');
    }

    // Validate latitude range (-90 to 90)
    if (typeof reportData.latitude !== 'number' || reportData.latitude < -90 || reportData.latitude > 90) {
      throw new BadRequestError('Latitude must be a number between -90 and 90');
    }

    // Validate longitude range (-180 to 180)
    if (typeof reportData.longitude !== 'number' || reportData.longitude < -180 || reportData.longitude > 180) {
      throw new BadRequestError('Longitude must be a number between -180 and 180');
    }

    const result = await reportDao.createReport(reportData);
    return result;
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
    return report;
  } catch (err) {
    throw err;
  }
};


