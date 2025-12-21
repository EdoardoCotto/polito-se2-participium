"use strict";
const sqlite = require('sqlite3');
const path = require('node:path');

const dbPath = path.join(__dirname, '..', 'db', 'participium.db');
const db = new sqlite.Database(dbPath, (err) => {
  if (err) throw new Error("DB Connection Fail");
});

// Helper per rendere le funzioni DB compatibili con async/await
const dbGet = (sql, params) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});

const dbRun = (sql, params) => new Promise(function(resolve, reject) {
  db.run(sql, params, function(err) { err ? reject(err) : resolve(this); });
});

exports.createComment = async (reportId, authorId, comment) => {
  // 1. VERIFICA
  const checkSql = `SELECT officerId, external_maintainerId FROM Reports WHERE id = ?`;
  const report = await dbGet(checkSql, [reportId]);

  if (!report) throw new Error('ReportNotFound');

  // 2. LOGICA DI BLOCCO
  const isAssignedOfficer = report.officerId === authorId;
  const isAssignedMaintainer = report.external_maintainerId === authorId;

  if (!isAssignedOfficer && !isAssignedMaintainer) {
    throw new Error('UnauthorizedComment: User is not assigned to this report');
  }

  // 3. ESECUZIONE
  const insertSql = `INSERT INTO InternalComments (reportId, authorId, comment) VALUES (?, ?, ?)`;
  const result = await dbRun(insertSql, [reportId, authorId, comment]);

  // 4. RESTITUZIONE
  const selectSql = `
    SELECT 
      C.id, C.reportId, C.comment, C.created_at,
      U.id as authorId, U.name, U.surname, U.type as authorRole
    FROM InternalComments C
    JOIN Users U ON C.authorId = U.id
    WHERE C.id = ?
  `;
  
  return await dbGet(selectSql, [result.lastID]);
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