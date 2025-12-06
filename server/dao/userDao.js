"use strict";

const sqlite = require('sqlite3');
const bcrypt = require('bcrypt');
const path = require('node:path');
const { ALLOWED_ROLES } = require('../constants/roles');

// Connessione al database
const dbPath = path.join(__dirname, '..', 'db', 'participium.db');
const db = new sqlite.Database(dbPath, (err) => {
  if (err) throw err;
});

/** 
 * Get user by username (login)
 * @param {string} username - username dell'utente
 * @param {string} password - password in chiaro fornita al login
 * @returns {Promise<Object>} - utente autenticato o false se non valido
 */
exports.getUser = (username, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM Users WHERE username = ?';
    db.get(sql, [username], (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      if (!row) {
        resolve(false); // utente non trovato
        return;
      }

      // Verifica password
      bcrypt.compare(password, row.password, (err, isMatch) => {
        if (err) {
          reject(err);
          return;
        }

        if (isMatch) {
          // Rimuoviamo password e salt prima di restituire
          const user = {
            id: row.id,
            username: row.username,
            name: row.name,
            surname: row.surname,
            type: row.type,
          };
          resolve(user);
        } else {
          resolve(false); // password errata
        }
      });
    });
  });
};

/**
 * Get user by ID (usato da passport.deserializeUser)
 * @param {number} id
 * @returns {Promise<Object>}
 */
exports.getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id, username, email, name, surname, type, telegram_nickname, personal_photo_path, mail_notifications FROM Users WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
};

/**
 * Get user by username (usato da passport.deserializeUser)
 * @param {string} username
 * @returns {Promise<Object>}
 */
exports.getUserByUsername = (username) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id FROM Users WHERE username = ?';
    db.get(sql, [username], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
};

/**
 * Get user by email (usato da passport.deserializeUser)
 * @param {string} email
 * @returns {Promise<Object>}
 */
exports.getUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id FROM Users WHERE email = ?';
    db.get(sql, [email], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
};

/**
 * Create a new user (registration)
 * @param {{ username: string, email: string, name: string, surname: string, password: string, type?: string }} newUser
 * @returns {Promise<{ id: number, username: string, email: string, name: string, surname: string, type: string }>}
 */
exports.createUser = ({ username, email, name, surname, password, type = 'citizen' }) => {

  // 1. La funzione Executor della Promise NON è 'async' (OK per SonarQube)
  return new Promise((resolve, reject) => { 

    // 2. Avviamo una Funzione Anonima Auto-Eseguita Asincrona (IIFE)
    // Questo crea un contesto 'async' valido per 'await'
    (async () => {
      try {

        // Uso di await qui DENTRO è ora consentito!
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(password, salt);

        const insertSql = `INSERT INTO Users (username, email, name, surname, type, password, salt)
                           VALUES (?, ?, ?, ?, ?, ?, ?)`;

        // db.run usa una callback, quindi non serve await
        db.run(insertSql, [username, email, name, surname, type, hash, salt], function (insertErr) {
          if (insertErr) {
            console.error('Error inserting user:', insertErr);
            reject(insertErr); // Chiamiamo reject dalla Promise esterna
            return;
          }

          resolve({ id: this.lastID, username, email, name, surname, type }); // Chiamiamo resolve dalla Promise esterna
        });

      } catch (e) {
        // Qualsiasi errore da await (bcrypt) viene catturato e rigetta la Promise esterna
        reject(e);
      }
    })(); // La funzione viene eseguita immediatamente

    // NOTA: il blocco try-catch esterno non è più necessario
    // in quanto tutte le operazioni asincrone e sincrone sono gestite
    // all'interno dell'IIFE
    
  });
};

/**
 * Update user type/role by user id
 * @param {number} userId
 * @param {string} newType - must be one of ALLOWED_ROLES
 * @returns {Promise<{ id:number, type:string }>} updated info
 */
exports.updateUserTypeById = (userId, newType) => {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_ROLES.includes(newType)) {
      reject(new Error('Invalid role'));
      return;
    }
    const sql = 'UPDATE Users SET type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    db.run(sql, [newType, userId], function (err) {
      if (err) {
        reject(err);
        return;
      }
      if (this.changes === 0) {
        resolve(null);
        return;
      }
      resolve({ id: userId, type: newType });
    });
  });
};

/**
 * Return all municipality users (everyone who is NOT citizen or admin).
 */
exports.findMunicipalityUsers = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT id, username, email, name, surname, type
      FROM Users
      WHERE type NOT IN ('citizen','admin')
      ORDER BY surname ASC, name ASC, username ASC
    `;
    db.all(sql, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
};

/**
 * Get all external maintainers
 * @returns {Promise<Object[]>}
 */
exports.getExternalMaintainers = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT id, username, email, name, surname, type
      FROM Users
      WHERE type = 'external_mantainer'
      ORDER BY surname ASC, name ASC, username ASC
    `;
    db.all(sql, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
};

/**
 * Helper: Check if a field should be updated
 * Returns true if the field should be updated, false if it should be skipped
 */
function shouldUpdateField(newValue, currentValue) {
  // Skip if both are null (no change needed)
  return !(newValue === null && currentValue === null);
}

/**
 * Helper: Build update fields and values from updateData
 */
function buildUpdateFields(updateData, currentUser) {
  const fields = [];
  const values = [];

  if (updateData.telegram_nickname !== undefined) {
    if (shouldUpdateField(updateData.telegram_nickname, currentUser.telegram_nickname)) {
      fields.push('telegram_nickname = ?');
      values.push(updateData.telegram_nickname);
    }
  }

  if (updateData.personal_photo_path !== undefined) {
    if (shouldUpdateField(updateData.personal_photo_path, currentUser.personal_photo_path)) {
      fields.push('personal_photo_path = ?');
      values.push(updateData.personal_photo_path);
    }
  }

  if (updateData.mail_notifications !== undefined) {
    if (shouldUpdateField(updateData.mail_notifications, currentUser.mail_notifications)) {
      fields.push('mail_notifications = ?');
      values.push(updateData.mail_notifications);
    }
  }

  return { fields, values };
}

/**
 * Helper: Build result object with only updated fields
 */
function buildResultObject(userId, updateData, currentUser) {
  const result = { id: userId };

  if (updateData.telegram_nickname !== undefined && shouldUpdateField(updateData.telegram_nickname, currentUser.telegram_nickname)) {
    result.telegram_nickname = updateData.telegram_nickname;
  }
  if (updateData.personal_photo_path !== undefined && shouldUpdateField(updateData.personal_photo_path, currentUser.personal_photo_path)) {
    result.personal_photo_path = updateData.personal_photo_path;
  }
  if (updateData.mail_notifications !== undefined && shouldUpdateField(updateData.mail_notifications, currentUser.mail_notifications)) {
    result.mail_notifications = updateData.mail_notifications;
  }

  return result;
}

exports.updateUserProfile = (userId, updateData) => {
  return new Promise((resolve, reject) => {
    // Prima recupera i dati attuali dell'utente
    const selectSql = 'SELECT telegram_nickname, personal_photo_path, mail_notifications FROM Users WHERE id = ?';
    
    db.get(selectSql, [userId], (err, currentUser) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!currentUser) {
        reject(new Error('User not found'));
        return;
      }

      // Costruisci dinamicamente la query in base ai campi
      const { fields, values } = buildUpdateFields(updateData, currentUser);

      // Se non ci sono campi da aggiornare, ritorna senza fare nulla
      if (fields.length === 0) {
        resolve({ id: userId });
        return;
      }

      // Aggiungi sempre updated_at
      fields.push('updated_at = CURRENT_TIMESTAMP');

      // Costruisci la query SQL
      const sql = `UPDATE Users SET ${fields.join(', ')} WHERE id = ?`;
      values.push(userId);

      db.run(sql, values, function (err) {
        if (err) {
          reject(err);
          return;
        }
        
        // Restituisci solo i campi effettivamente aggiornati
        const result = buildResultObject(userId, updateData, currentUser);
        resolve(result);
      });
    });
  });
}
