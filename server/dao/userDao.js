"use strict";

const sqlite = require('sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');
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
  return new Promise(async (resolve, reject) => {
    try {
      // Hash password with salt
      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);
      const hash = await bcrypt.hash(password, salt);

      const insertSql = `INSERT INTO Users (username, email, name, surname, type, password, salt)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`;
      db.run(insertSql, [username, email, name, surname, type, hash, salt], function (insertErr) {
        if (insertErr) {
          console.error('Error inserting user:', insertErr);
          reject(insertErr);
          return;
        }
        resolve({ id: this.lastID, username, email, name, surname, type });
      });
    } catch (e) {
      reject(e);
    }
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
      const fields = [];
      const values = [];

      // Per telegram_nickname: accetta null solo se prima c'era un valore
      if (updateData.telegram_nickname !== undefined) {
        if (updateData.telegram_nickname === null && currentUser.telegram_nickname === null) {
          // Non fare nulla: era già null
        } else {
          fields.push('telegram_nickname = ?');
          values.push(updateData.telegram_nickname);
        }
      }

      // Per personal_photo_path: accetta null solo se prima c'era un valore
      if (updateData.personal_photo_path !== undefined) {
        if (updateData.personal_photo_path === null && currentUser.personal_photo_path === null) {
          // Non fare nulla: era già null
        } else {
          fields.push('personal_photo_path = ?');
          values.push(updateData.personal_photo_path);
        }
      }

      // Per mail_notifications: accetta null solo se prima c'era un valore
      if (updateData.mail_notifications !== undefined) {
        if (updateData.mail_notifications === null && currentUser.mail_notifications === null) {
          // Non fare nulla: era già null
        } else {
          fields.push('mail_notifications = ?');
          values.push(updateData.mail_notifications);
        }
      }

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
        const result = { id: userId };
        if (updateData.telegram_nickname !== undefined && !(updateData.telegram_nickname === null && currentUser.telegram_nickname === null)) {
          result.telegram_nickname = updateData.telegram_nickname;
        }
        if (updateData.personal_photo_path !== undefined && !(updateData.personal_photo_path === null && currentUser.personal_photo_path === null)) {
          result.personal_photo_path = updateData.personal_photo_path;
        }
        if (updateData.mail_notifications !== undefined && !(updateData.mail_notifications === null && currentUser.mail_notifications === null)) {
          result.mail_notifications = updateData.mail_notifications;
        }
        
        resolve(result);
      });
    });
  });
}
