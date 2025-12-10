"use strict";

const sqlite = require('sqlite3');
const path = require('node:path');

// Connessione al database
const dbPath = path.join(__dirname, '..', 'db', 'participium.db');
const db = new sqlite.Database(dbPath, (err) => {
  if (err) throw new Error("DB Connection Fail");
});

/**
 * Create a new report with details and photos.
 * @param {{ userId: number, latitude: number, longitude: number, title: string, description: string, category: string, photos: string[] }} reportData
 * @returns {Promise<Object>}
 */
exports.createReport = ({ userId = null, latitude, longitude, title, description, category, photos }) => {
  return new Promise((resolve, reject) => {
    const [photo1, photo2, photo3] = [
      photos[0],
      photos[1] || null,
      photos[2] || null,
    ];

    const insertSql = `INSERT INTO Reports (userId, latitude, longitude, title, description, category, image_path1, image_path2, image_path3)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(
      insertSql,
      [userId, latitude, longitude, title, description, category, photo1, photo2, photo3],
      function (insertErr) {
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
      }
    );
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

/**
 * Update report status / review info
 * @param {number} reportId
 * @param {{ status: string, rejectionReason?: string|null, technicalOffice?: string|null }} data
 * @returns {Promise<Object|null>}
 */
exports.updateReportReview = (reportId, { status, rejectionReason = null, technicalOffice = null, officerId = null }) => {
  return new Promise((resolve, reject) => {
    // Nota: Aggiungiamo officerId alla query
    const sql = `
      UPDATE Reports
      SET status = ?,
          rejection_reason = ?,
          technical_office = ?,
          officerId = ?, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    // Attenzione all'ordine dei parametri
    db.run(sql, [status, rejectionReason, technicalOffice, officerId, reportId], function (err) {
      if (err) {
        return reject(err);
      }
      if (this.changes === 0) {
        return resolve(null);
      }
      // Restituiamo il report aggiornato
      db.get('SELECT * FROM Reports WHERE id = ?', [reportId], (err2, row) => {
        if (err2) {
          return reject(err2);
        }
        resolve(row);
      });
    });
  });
};

/**
 * Get reports filtered by status
 * @param {string} status
 * @returns {Promise<Object[]>}
 */
exports.getReportsByStatus = (status, options = {}) => {
  return new Promise((resolve, reject) => {
    const { boundingBox } = options || {};

    let sql = `
      SELECT 
        R.id          AS reportId,
        R.userId      AS reportUserId,
        R.latitude,
        R.longitude,
        R.title,
        R.description,
        R.category,
        R.status,
        R.rejection_reason,
        R.technical_office,
        R.created_at,
        R.updated_at,
        R.image_path1,
        R.image_path2,
        R.image_path3,
        U.id          AS userId,
        U.username    AS userUsername,
        U.name        AS userName,
        U.surname     AS userSurname,
        U.email       AS userEmail
      FROM Reports R
      LEFT JOIN Users U ON R.userId = U.id
      WHERE R.status = ?
    `;

    const params = [status];

    if (boundingBox) {
      sql += `
        AND R.latitude BETWEEN ? AND ?
        AND R.longitude BETWEEN ? AND ?
      `;
      params.push(
        boundingBox.south,
        boundingBox.north,
        boundingBox.west,
        boundingBox.east,
      );
    }

    sql += ' ORDER BY R.created_at DESC';

    db.all(sql, params, (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows || []);
    });
  });
};



exports.getCitizenReports = (options = {}) => {
  return new Promise((resolve, reject) => {
    const { boundingBox } = options || {};
    const params = [];
    let sql = `
      SELECT 
        R.id          AS reportId,
        R.userId      AS reportUserId,
        R.latitude,
        R.longitude,
        R.title,
        R.description,
        R.category,
        R.status,
        R.rejection_reason,
        R.technical_office,
        R.created_at,
        R.updated_at,
        R.image_path1,
        R.image_path2,
        R.image_path3,
        U.id          AS userId,
        U.username    AS userUsername,
        U.name        AS userName,
        U.surname     AS userSurname,
        U.email       AS userEmail
      FROM Reports R
      LEFT JOIN Users U ON R.userId = U.id
      WHERE R.status != 'pending'  AND R.status != 'rejected'
    `;


    if (boundingBox) {
      sql += `
        AND R.latitude BETWEEN ? AND ?
        AND R.longitude BETWEEN ? AND ?
      `;
      params.push(
        boundingBox.south,
        boundingBox.north,
        boundingBox.west,
        boundingBox.east,
      );
    }

    sql += ' ORDER BY R.created_at DESC';

    db.all(sql, params, (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows || []);
    });
  });
};
/**
 * Get reports assigned to a specific officer
 * @param {number} officerId
 * @returns {Promise<Object[]>}
 */
exports.getReportsByOfficerId = (officerId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        -- Dati del Report
        R.id          AS reportId,
        R.userId      AS reportUserId,
        R.latitude,
        R.longitude,
        R.title,
        R.description,
        R.category,
        R.status,
        R.rejection_reason,
        R.technical_office,
        R.created_at,
        R.updated_at,
        R.image_path1,
        R.image_path2,
        R.image_path3,
        
        -- Dati dell'Utente (Cittadino/Creatore)
        U.id          AS userId,
        U.username    AS userUsername,
        U.name        AS userName,
        U.surname     AS userSurname,
        U.email       AS userEmail,

        -- Dati del Manutentore Esterno (Nuova Sezione)
        EM.id         AS maintainerId,
        EM.username   AS maintainerUsername,
        EM.name       AS maintainerName,
        EM.surname    AS maintainerSurname,
        EM.email      AS maintainerEmail,
        EM.type       AS maintainerType

      FROM Reports R
      -- Join per l'utente che ha creato il report
      LEFT JOIN Users U ON R.userId = U.id
      -- Join per il manutentore esterno (usando alias EM)
      LEFT JOIN Users EM ON R.external_maintainerId = EM.id
      
      WHERE R.officerId = ?
        AND R.status != 'rejected'
      ORDER BY R.created_at DESC
    `;
    
    db.all(sql, [officerId], (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows || []);
    });
  });
};
// Trova l'ID dell'impiegato con meno report assegnati per un dato ruolo
exports.getLeastLoadedOfficer = (technicalOfficeRole) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT u.id, COUNT(r.id) as workload
      FROM Users u
      LEFT JOIN Reports r ON u.id = r.officerId AND r.status = 'assigned'
      WHERE u.type = ?
      GROUP BY u.id
      ORDER BY workload ASC, u.id ASC
      LIMIT 1
    `;
    
    db.get(sql, [technicalOfficeRole], (err, row) => {
      if (err) {
        return reject(err);
      }
      // Se non ci sono lavoratori per quel ruolo, row sarà undefined
      resolve(row ? row.id : null);
    });
  });
};

/**
 * Assign a report to an external maintainer
 * @param {number} reportId
 * @param {number} externalMaintainerId
 * @returns {Promise<Object|null>}
 */
exports.assignReportToExternalMaintainer = (reportId, externalMaintainerId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE Reports
      SET external_maintainerId= ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    db.run(sql, [externalMaintainerId, reportId], function (err) {
      if (err) {
        return reject(err);
      }
      if (this.changes === 0) {
        return resolve(null);
      }
      // Return the updated report
      db.get('SELECT * FROM Reports WHERE id = ?', [reportId], (err2, row) => {
        if (err2) {
          return reject(err2);
        }
        resolve(row);
      });
    });
  });
};

/**
 * Update report status by the assigned officer (Maintainer)
 * @param {number} reportId
 * @param {number} officerId
 * @param {string} newStatus
 * @returns {Promise<Object|null>}
 */
exports.updateReportStatusByOfficer = (reportId, officerId, newStatus) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE Reports
      SET status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND officerId = ?
    `;

    db.run(sql, [newStatus, reportId, officerId], function (err) {
      if (err) {
        return reject(err);
      }
      if (this.changes === 0) {
        // Nessuna riga aggiornata: o il report non esiste, o non è assegnato a questo officer
        return resolve(null);
      }
      // Restituiamo il report aggiornato per conferma
      db.get('SELECT * FROM Reports WHERE id = ?', [reportId], (err2, row) => {
        if (err2) {
          return reject(err2);
        }
        resolve(row);
      });
    });
  });
};
exports.updateReportStatusByExternalMaintainer = (reportId, maintainerId, newStatus) => {
  return new Promise((resolve, reject) => {
    // 1. UPDATE usando external_maintainerId
    const sqlUpdate = `
      UPDATE Reports
      SET status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND external_maintainerId = ?
    `;

    db.run(sqlUpdate, [newStatus, reportId, maintainerId], function (err) {
      if (err) return reject(err);
      
      if (this.changes === 0) {
        // Nessuna riga aggiornata: report inesistente o non assegnato a questo maintainer
        return resolve(null);
      }

      // 2. SELECT con le JOIN (necessario per mapReportRow)
      // Copiamo la logica della SELECT usata in getReportsByExternalMaintainerId
      // così l'oggetto ritornato ha officerName, userEmail, ecc.
      const sqlSelect = `
        SELECT 
          R.id          AS reportId,
          R.userId      AS reportUserId,
          R.latitude, R.longitude, R.title, R.description, R.category,
          R.status, R.rejection_reason, R.technical_office,
          R.created_at, R.updated_at,
          R.image_path1, R.image_path2, R.image_path3,
          
          -- Dati Utente
          U.id AS userId, U.username AS userUsername, U.name AS userName, 
          U.surname AS userSurname, U.email AS userEmail,

          -- Dati Officer (Importante per il maintainer vedere chi è l'officer)
          OFF.id AS officerId, OFF.username AS officerUsername, 
          OFF.name AS officerName, OFF.surname AS officerSurname, OFF.email AS officerEmail

        FROM Reports R
        LEFT JOIN Users U ON R.userId = U.id
        LEFT JOIN Users OFF ON R.officerId = OFF.id
        WHERE R.id = ?
      `;

      db.get(sqlSelect, [reportId], (err2, row) => {
        if (err2) return reject(err2);
        resolve(row);
      });
    });
  });
};
/**
 * Get reports assigned to a specific external maintainer
 * @param {number} maintainerId
 * @returns {Promise<Object[]>}
 */
exports.getReportsByExternalMaintainerId = (maintainerId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        -- Dati del Report
        R.id          AS reportId,
        R.userId      AS reportUserId,
        R.latitude,
        R.longitude,
        R.title,
        R.description,
        R.category,
        R.status,
        R.rejection_reason,
        R.technical_office,
        R.created_at,
        R.updated_at,
        R.image_path1,
        R.image_path2,
        R.image_path3,
        
        -- Dati dell'Utente (Cittadino)
        U.id          AS userId,
        U.username    AS userUsername,
        U.name        AS userName,
        U.surname     AS userSurname,
        U.email       AS userEmail,

        -- Dati dell'Officer Interno (Chi ha assegnato il report)
        OFF.id         AS officerId,
        OFF.username   AS officerUsername,
        OFF.name       AS officerName,
        OFF.surname    AS officerSurname,
        OFF.email      AS officerEmail

      FROM Reports R
      -- Join per l'utente che ha creato il report
      LEFT JOIN Users U ON R.userId = U.id
      -- Join per l'officer interno (usando alias OFF)
      LEFT JOIN Users OFF ON R.officerId = OFF.id
      
      WHERE R.external_maintainerId = ?
        AND R.status != 'rejected' -- O status IN ('assigned', 'progress', 'resolved', 'suspended')
      ORDER BY R.created_at DESC
    `;
    
    db.all(sql, [maintainerId], (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows || []);
    });
  });
};