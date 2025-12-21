"use strict";
const sqlite = require('sqlite3');
const path = require('node:path');

const dbPath = path.join(__dirname, '..', 'db', 'participium.db');
const db = new sqlite.Database(dbPath);

/**
 * Ottiene una strada per nome
 */
exports.getStreetByName = (streetName) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM Streets WHERE street_name = ? AND city = ?',
      [streetName, 'Torino'],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

/**
 * Aggiorna le coordinate e la geometria di una strada
 */
exports.updateStreetGeocoding = (streetId, geoData) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE Streets 
       SET latitude = ?, 
           longitude = ?, 
           min_lat = ?, 
           max_lat = ?, 
           min_lon = ?, 
           max_lon = ?,
           geometry = ?
       WHERE id = ?`,
      [
        geoData.latitude,
        geoData.longitude,
        geoData.min_lat,
        geoData.max_lat,
        geoData.min_lon,
        geoData.max_lon,
        geoData.geometry || null,
        streetId
      ],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
};

/**
 * Cerca vie per autocompletamento
 */
exports.searchStreets = (query, limit = 10) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT street_name, city, latitude, longitude 
       FROM Streets 
       WHERE city = 'Torino' AND street_name LIKE ? 
       ORDER BY street_name 
       LIMIT ?`,
      [`${query}%`, limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};