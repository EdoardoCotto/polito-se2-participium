'use strict';

const reportRepository = require('../repository/reportRepository');
const AppError = require('../errors/AppError');

/**
 * Create a new report with location (latitude and longitude)
 * Expects { latitude, longitude } in the request body.
 * The userId is taken from the authenticated session (req.user.id).
 */
exports.createReport = async (req, res) => {
  try {
    const { latitude, longitude } = req.body || {};
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const reportData = {
      userId: req.user.id,
      latitude,
      longitude
    };

    const created = await reportRepository.createReport(reportData);
    return res.status(201).json(created);
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Get report by ID
 */
exports.getReportById = async (req, res) => {
  try {
    const reportId = Number(req.params.id);
    if (!Number.isInteger(reportId)) {
      return res.status(400).json({ error: 'Invalid report id' });
    }

    const report = await reportRepository.getReportById(reportId);
    return res.status(200).json(report);
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


