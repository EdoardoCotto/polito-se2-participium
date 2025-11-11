"use strict";

const sqlite = require('sqlite3');
const path = require('path');

// Connessione al database
const dbPath = path.join(__dirname, '..', 'db', 'participium.db');
const db = new sqlite.Database(dbPath, (err) => {
  if (err) throw err;
});

/**
 * Create a new report with location (latitude and longitude)
 * @param {{ userId: number, latitude: number, longitude: number }} reportData
 * @returns {Promise<{ id: number, userId: number, latitude: number, longitude: number, created_at: string, updated_at: string }>}
 */
exports.createReport = ({ userId, latitude, longitude }) => {
  return new Promise((resolve, reject) => {
    const insertSql = `INSERT INTO Reports (userId, latitude, longitude)
                       VALUES (?, ?, ?)`;
    db.run(insertSql, [userId, latitude, longitude], function (insertErr) {
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


