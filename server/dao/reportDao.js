"use strict";

const sqlite = require('sqlite3');
const path = require('path');

// Connessione al database
const dbPath = path.join(__dirname, '..', 'db', 'participium.db');
const db = new sqlite.Database(dbPath, (err) => {
  if (err) throw err;
});

/**
 * Create a new report with details and photos.
 * @param {{ userId: number, latitude: number, longitude: number, title: string, description: string, category: string, photos: string[] }} reportData
 * @returns {Promise<Object>}
 */
exports.createReport = ({ userId, latitude, longitude, title, description, category, photos }) => {
  return new Promise((resolve, reject) => {
    const [photo1, photo2, photo3] = [
      photos[0],
      photos[1] || null,
      photos[2] || null,
    ];

    const insertSql = `INSERT INTO Reports (userId, latitude, longitude, title, description, category, image_path1, image_path2, image_path3)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(insertSql, [userId, latitude, longitude, title, description, category, photo1, photo2, photo3], function (insertErr) {
      if (insertErr) {
        console.error('Error inserting report:', insertErr);
        reject(insertErr);
        return;
      }
      // Retrieve the created report
      const selectSql = 'SELECT * FROM Reports WHERE id = ?';
      db.get(selectSql, [this.lastID], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  });
};

/**
 * Get report by ID
 * @param {number} reportId
 * @returns {Promise<Object>}
 */
exports.getReportById = (reportId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM Reports WHERE id = ?';
    db.get(sql, [reportId], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
};


