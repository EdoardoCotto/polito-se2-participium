// controller/ReportController.js
'use strict';

const reportRepository = require('../repository/reportRepository');
const AppError = require('../errors/AppError');
const path = require('path'); 


/**
 * Create a new report with location (latitude and longitude)
 * ...
 */
exports.createReport = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      title,
      description,
      category,
      photos,
    } = req.body || {};

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ error: 'Invalid latitude/longitude' });
    }

    let photoUrls = [];

    if (Array.isArray(req.files) && req.files.length > 0) {
      photoUrls = req.files.map((file) => `/static/uploads/${file.filename}`);
    } else if (Array.isArray(photos) && photos.length > 0) {
      photoUrls = photos;
    } else if (typeof photos === 'string' && photos.trim()) {
      photoUrls = [photos.trim()];
    }

    if (photoUrls.length === 0) {
      return res.status(400).json({ error: 'At least one photo is required' });
    }

    const reportData = {
      userId: req.user.id,
      latitude: lat,
      longitude: lon,
      title,
      description,
      category,
      photos: photoUrls,
    };

    const created = await reportRepository.createReport(reportData);
    return res.status(201).json(created);
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    if (
      err &&
      typeof err.message === 'string' &&
      (err.message.includes('Invalid file type') ||
        err.message.includes('File too large') ||
        err.message.includes('Too many files'))
    ) {
      return res.status(400).json({ error: err.message });
    }

    console.error('Error in createReport controller:', err);
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

/**
 * Get all pending reports (for municipal public relations officer)
 */
exports.getPendingReports = async (req, res) => {
  try {
    const reports = await reportRepository.getPendingReports();

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    // es. http://localhost:3001

    const enriched = reports.map((r) => {
      const photoUrls = (r.photos || []).map((p) => {
        // p può essere un path assoluto o relativo: estraiamo solo il nome del file
        const fileName = path.basename(p); 
        // Costruiamo l'URL pubblico servito da Express:
        return `${baseUrl}/static/uploads/${fileName}`;
      });

      return {
        ...r,
        photoUrls, // nuovo campo con gli URL completi delle immagini
      };
    });

    return res.status(200).json(enriched);
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('Error in getPendingReports controller:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Review (accept or reject) a report.
 * Body: 
 *   - status: "accepted" | "rejected"
 *   - explanation?: string (obbligatoria se "rejected")
 *   - technicalOffice?: string (obbligatoria se "accepted")
 */
exports.reviewReport = async (req, res) => {
  try {
    const reportId = Number(req.params.id);
    if (!Number.isInteger(reportId)) {
      return res.status(400).json({ error: 'Invalid report id' });
    }

    const { status, explanation, technicalOffice } = req.body || {};

    const updated = await reportRepository.reviewReport(reportId, {
      status,
      explanation,
      technicalOffice,
    });

    return res.status(200).json(updated);
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('Error in reviewReport controller:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};