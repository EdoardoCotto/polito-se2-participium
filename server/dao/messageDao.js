"use strict";
const sqlite = require('sqlite3');
const path = require('node:path');

const dbPath = path.join(__dirname, '..', 'db', 'participium.db');
const db = new sqlite.Database(dbPath, (err) => {
  if (err) throw new Error("DB Connection Fail");
});

const dbGet = (sql, params) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});

const dbRun = (sql, params) => new Promise(function(resolve, reject) {
  db.run(sql, params, function(err) { err ? reject(err) : resolve(this); });
});

const dbAll = (sql, params) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
});

/**
 * Inserisce un nuovo messaggio e restituisce i dettagli completi dell'autore
 */
exports.createMessage = async (reportId, senderId, message) => {
  // 1. Inserimento
  const insertSql = `INSERT INTO Messages (reportId, senderId, message) VALUES (?, ?, ?)`;
  const result = await dbRun(insertSql, [reportId, senderId, message]);

  // 2. Recupero del messaggio appena creato con dettagli utente
  const selectSql = `
    SELECT 
      M.id, M.reportId, M.message, M.created_at,
      U.id as senderId, U.name, U.surname, U.type as senderRole, U.personal_photo_path
    FROM Messages M
    JOIN Users U ON M.senderId = U.id
    WHERE M.id = ?
  `;
  
  return await dbGet(selectSql, [result.lastID]);
};

/**
 * Recupera tutti i messaggi di una segnalazione
 */
exports.getMessagesByReportId = async (reportId) => {
  const sql = `
    SELECT 
      M.id, M.reportId, M.message, M.created_at,
      U.id as senderId, U.name, U.surname, U.type as senderRole, U.personal_photo_path
    FROM Messages M
    JOIN Users U ON M.senderId = U.id
    WHERE M.reportId = ?
    ORDER BY M.created_at ASC
  `;
  return await dbAll(sql, [reportId]);
};