// controller/ReportController.js
'use strict';

const reportRepository = require('../repository/reportRepository');
const AppError = require('../errors/AppError');
const path = require('path');

const buildPhotoUrls = (photos = [], req) => {
  if (!Array.isArray(photos) || !req) {
    return [];
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return photos
    .map((photoPath) => (photoPath || '').trim())
    .filter((photoPath) => photoPath.length > 0)
    .map((photoPath) => {
      const fileName = path.basename(photoPath);
      return `${baseUrl}/static/uploads/${fileName}`;
    });
};

const parseBoundingBox = (query = {}) => {
  const { north, south, east, west } = query;
  const providedKeys = [north, south, east, west].filter((value) => value !== undefined);

  if (providedKeys.length === 0) {
    return null;
  }

  if (providedKeys.length > 0 && providedKeys.length < 4) {
    throw new AppError('Bounding box requires north, south, east, and west parameters', 400);
  }

  const parsed = {
    north: parseFloat(north),
    south: parseFloat(south),
    east: parseFloat(east),
    west: parseFloat(west),
  };

  const hasInvalidNumber = Object.values(parsed).some((value) => !Number.isFinite(value));
  if (hasInvalidNumber) {
    throw new AppError('Bounding box coordinates must be valid numbers', 400);
  }

  if (parsed.south > parsed.north) {
    throw new AppError('South latitude cannot be greater than north latitude', 400);
  }

  if (parsed.west > parsed.east) {
    throw new AppError('West longitude cannot be greater than east longitude', 400);
  }

  return parsed;
}; 


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
      anonymous
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

    const created = await reportRepository.createReport(reportData, anonymous);
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
 * Get approved (accepted) reports for the public map view
 */
exports.getApprovedReports = async (req, res) => {
  try {
    const boundingBox = parseBoundingBox(req.query);
    const reports = await reportRepository.getApprovedReports({ boundingBox });
    const enriched = reports.map((report) => ({
      ...report,
      photoUrls: buildPhotoUrls(report.photos, req),
    }));

    return res.status(200).json(enriched);
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('Error in getApprovedReports controller:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


exports.getCitizenReports = async (req, res) => {
  try {
    const options = {};
    
    
    if (req.query.north && req.query.south && req.query.east && req.query.west) {
      options.boundingBox = {
        north: req.query.north,
        south: req.query.south,
        east: req.query.east,
        west: req.query.west
      };
    }
   
    const reports = await reportRepository.getCitizenReports(options);
    const enriched = reports.map((report) => ({
      ...report,
      photoUrls: buildPhotoUrls(report.photos, req),
    }));

    return res.status(200).json(enriched);
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('Error in getApprovedReports controller:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Get reports assigned to the logged-in technical office staff member
 */
exports.getAssignedReports = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const reports = await reportRepository.getAssignedReports(req.user.id);
    const enriched = reports.map((report) => ({
      ...report,
      photoUrls: buildPhotoUrls(report.photos, req),
    }));

    return res.status(200).json(enriched);
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('Error in getAssignedReports controller:', err);
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