"use strict";
const sqlite = require('sqlite3');
const path = require('node:path');

const dbPath = path.join(__dirname, '..', 'db', 'participium.db');
const db = new sqlite.Database(dbPath, (err) => {
  if (err) throw new Error("DB Connection Fail");
});

/**
 * Add a new internal comment
 */
exports.createComment = (reportId, authorId, comment) => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO InternalComments (reportId, authorId, comment) VALUES (?, ?, ?)`;
    db.run(sql, [reportId, authorId, comment], function (err) {
      if (err) return reject(err);
      
      // Fetch the created comment with author details (same format as getCommentsByReportId)
      const selectSql = `
        SELECT 
          C.id, C.reportId, C.comment, C.created_at,
          U.id as authorId, U.name, U.surname, U.type as authorRole
        FROM InternalComments C
        JOIN Users U ON C.authorId = U.id
        WHERE C.id = ?
      `;
      db.get(selectSql, [this.lastID], (err2, row) => {
        if (err2) return reject(err2);
        resolve(row);
      });
    });
  });
};

/**
 * Get all comments for a specific report
 * Include author details (Name, Surname, Role)
 */
exports.getCommentsByReportId = (reportId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        C.id, C.reportId, C.comment, C.created_at,
        U.id as authorId, U.name, U.surname, U.type as authorRole
      FROM InternalComments C
      JOIN Users U ON C.authorId = U.id
      WHERE C.reportId = ?
      ORDER BY C.created_at ASC
    `;
    db.all(sql, [reportId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
};