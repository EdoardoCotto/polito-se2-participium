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
    
    // 1. VERIFICA: Recuperiamo i dati di assegnazione del report
    const checkSql = `SELECT officerId, external_maintainerId FROM Reports WHERE id = ?`;
    
    db.get(checkSql, [reportId], (err, report) => {
      if (err) return reject(err);
      if (!report) return reject(new Error('ReportNotFound')); // O gestisci come preferisci

      // 2. LOGICA DI BLOCCO: 
      // Verifichiamo se l'autore è l'officer assegnato O il manutentore assegnato
      const isAssignedOfficer = (report.officerId === authorId);
      const isAssignedMaintainer = (report.external_maintainerId === authorId);

      // Se non è nessuno dei due, rifiutiamo la Promise
      if (!isAssignedOfficer && !isAssignedMaintainer) {
        // Usiamo un messaggio chiaro o un errore custom che il controller possa mappare in 403 Forbidden
        return reject(new Error('UnauthorizedComment: User is not assigned to this report'));
      }

      // 3. ESECUZIONE: Se autorizzato, procediamo con l'INSERT originale
      const insertSql = `INSERT INTO InternalComments (reportId, authorId, comment) VALUES (?, ?, ?)`;
      
      db.run(insertSql, [reportId, authorId, comment], function (err2) {
        if (err2) return reject(err2);
        
        // 4. RESTITUZIONE: Fetch del commento appena creato con i dettagli dell'autore
        const selectSql = `
          SELECT 
            C.id, C.reportId, C.comment, C.created_at,
            U.id as authorId, U.name, U.surname, U.type as authorRole
          FROM InternalComments C
          JOIN Users U ON C.authorId = U.id
          WHERE C.id = ?
        `;
        
        db.get(selectSql, [this.lastID], (err3, row) => {
          if (err3) return reject(err3);
          resolve(row);
        });
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