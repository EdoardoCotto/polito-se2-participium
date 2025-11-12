// controller/ReportController.js
'use strict';

const reportRepository = require('../repository/reportRepository');
const AppError = require('../errors/AppError');

/**
 * Create a new report with location (latitude and longitude)
 * - Accetta:
 *   - multipart/form-data: campi testuali in req.body + file in req.files (campo "photos")
 *   - application/json: tutti i campi in req.body e photos come array di URL/stringhe
 */
exports.createReport = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      title,
      description,
      category,
      photos, // nel caso JSON può arrivare come array o stringa singola
    } = req.body || {};

    // Auth obbligatoria
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Converte lat/lon (da form-data arrivano come stringhe)
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ error: 'Invalid latitude/longitude' });
    }

    // Costruisci array di foto:
    // - se multipart: prendi da req.files e mappa in URL pubblici
    // - altrimenti (JSON): usa "photos" dal body (array o stringa)
    let photoUrls = [];

    if (Array.isArray(req.files) && req.files.length > 0) {
      photoUrls = req.files.map((file) => `/static/uploads/${file.filename}`);
    } else if (Array.isArray(photos) && photos.length > 0) {
      photoUrls = photos;
    } else if (typeof photos === 'string' && photos.trim()) {
      // supporta anche una singola stringa
      photoUrls = [photos.trim()];
    }

    // Se vuoi rendere almeno una foto obbligatoria, lascia questo check attivo:
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
    // Errori tipici di multer (file type/size/limiti)
    if (err && typeof err.message === 'string' && (
      err.message.includes('Invalid file type') ||
      err.message.includes('File too large') ||
      err.message.includes('Too many files')
    )) {
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
