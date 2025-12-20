"use strict";
const sqlite = require('sqlite3');
const path = require('node:path');

const dbPath = path.join(__dirname, '..', 'db', 'participium.db');
const db = new sqlite.Database(dbPath);

exports.searchStreets = (query) => {
  return new Promise((resolve, reject) => {
    // Cerchiamo le vie che iniziano con la query (per autocomplete)
    const sql = "SELECT * FROM Streets WHERE street_name LIKE ? LIMIT 10";
    db.all(sql, [query + '%'], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

exports.getStreetByName = (name) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM Streets WHERE street_name = ?";
    db.get(sql, [name], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

exports.updateStreetGeocoding = (id, data) => {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE Streets SET latitude = ?, longitude = ?, 
                 min_lat = ?, max_lat = ?, min_lon = ?, max_lon = ? 
                 WHERE id = ?`;
    db.run(sql, [data.lat, data.lon, data.minLat, data.maxLat, data.minLon, data.maxLon, id], 
    (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};