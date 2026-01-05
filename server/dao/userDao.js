"use strict";

const sqlite = require('sqlite3');
const crypto = require('node:crypto');
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
 * @returns {Promise<Object|false|{error: string}>} - utente autenticato, false se non valido, o oggetto errore se non confermato
 */
exports.getUser = (username, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM Users U WHERE username = ?';
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
      bcrypt.compare(password, row.password, async (err, isMatch) => {
        if (err) {
          reject(err);
          return;
        }

        if (isMatch) {
          // Check if user needs confirmation (citizens only)
          const roles = await this.getRolesByUserId(row.id);
          if (roles.includes('citizen') && row.is_confirmed === 0) {
            resolve({ error: 'unconfirmed', email: row.email }); // Account not confirmed
            return;
          }

          // Rimuoviamo password e salt prima di restituire
          const user = {
            id: row.id,
            username: row.username,
            name: row.name,
            surname: row.surname,
            email: row.email,
            type: row.type,
            telegram_nickname: row.telegram_nickname,
            personal_photo_path: row.personal_photo_path,
            mail_notifications: row.mail_notifications,
            roles: roles
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
    const sql = `SELECT U.id, U.username, U.email, U.name, U.surname, U.type, UR.role, U.telegram_nickname, U.personal_photo_path, U.mail_notifications 
    FROM Users U
    LEFT JOIN UsersRoles UR ON U.id = UR.userId
    WHERE U.id = ?`;
    db.all(sql, [id], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!rows || rows.length === 0) {
        resolve(null);
        return;
      }

      // Prendi la prima riga per i dati comuni dell'utente
      const firstRow = rows[0];
      
      // Estrai tutti i ruoli dall'array di righe (solo per municipality_user)
      const roles = rows.map(row => row.role).filter(role => role !== null);
      
      // Costruisci l'oggetto user
      const user = {
        id: firstRow.id,
        username: firstRow.username,
        email: firstRow.email,
        name: firstRow.name,
        surname: firstRow.surname,
        type: firstRow.type,
        telegram_nickname: firstRow.telegram_nickname,
        personal_photo_path: firstRow.personal_photo_path,
        mail_notifications: firstRow.mail_notifications,
        roles: roles
      };
      
      resolve(user);
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

exports.getRolesByUserId = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT role FROM UsersRoles WHERE userId = ?';
    db.all(sql, [userId], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      const roles = rows.map(r => r.role);
      resolve(roles);
    });
  });
}

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
 * Get user by Telegram nickname
 * @param {string} telegramNickname - Telegram username (with or without @)
 * @returns {Promise<Object|null>}
 */

//TO UPDATE
exports.getUserByTelegramNickname = (telegramNickname) => {
  return new Promise((resolve, reject) => {
    // Normalize: remove @ if present, make case-insensitive
    const normalized = telegramNickname.replace(/^@/, '').toLowerCase();
    const sql = `SELECT U.id, U.username, U.email, U.name, U.surname, U.type, U.telegram_nickname, GROUP_CONCAT(UR.role) as roles
                FROM Users U
                LEFT JOIN UsersRoles UR ON U.id = UR.userId
                WHERE LOWER(REPLACE(U.telegram_nickname, "@", "")) = ?
                GROUP BY U.id`;
    db.all(sql, [normalized], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      // Trasforma roles da stringa a array
      const users = rows.map(row => ({
        ...row,
        roles: row.roles ? row.roles.split(',') : []
      }));
      resolve(users.length > 0 ? users : null);
    });
  });
};

/**
 * Generate a random 6-digit confirmation code
 * @returns {string} 6-digit confirmation code
 */
function generateConfirmationCode() {
  const min = 100000;
  const max = 999999;
  const range = max - min + 1;
  
  const code = crypto.randomInt(min, max + 1); 
  
  return code.toString();
}

/**
 * Create a new user (registration)
 * @param {{ username: string, email: string, name: string, surname: string, password: string, type?: string, skipConfirmation?: boolean }} newUser
 * @returns {Promise<{ id: number, username: string, email: string, name: string, surname: string, type: string, confirmationCode?: string }>}
 */
exports.createUser = ({ username, email, name, surname, password, type = 'citizen', skipConfirmation = false }) => {

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

        // Generate confirmation code and expiry only for citizens who need confirmation
        let confirmationCode = null;
        let confirmationExpiresAt = null;
        let isConfirmed = 1; // Default: confirmed (for non-citizens)

        if (type === 'citizen' && !skipConfirmation) {
          confirmationCode = generateConfirmationCode();
          // Set expiry to 30 minutes from now
          const expiryDate = new Date(Date.now() + 30 * 60 * 1000);
          confirmationExpiresAt = expiryDate.toISOString();
          isConfirmed = 0; // Citizen needs to confirm
        }

        const insertSql = `INSERT INTO Users (username, email, name, surname, type, password, salt, is_confirmed, confirmation_code, confirmation_code_expires_at)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.run(insertSql, [username, email, name, surname, type, hash, salt, isConfirmed, confirmationCode, confirmationExpiresAt], function (insertErr) {
          if (insertErr) {
            console.error('Error inserting user:', insertErr);
            reject(insertErr);
            return;
          }
          const userId = this.lastID;

          const result = { id: userId, username, email, name, surname, type };
          if (confirmationCode) {
            result.confirmationCode = confirmationCode;
          }
          resolve(result);
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

/**
 * Return all municipality users (everyone who is NOT citizen or admin).
 */

//TO UPDATE
exports.findMunicipalityUsers = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT U.id, U.username, U.email, U.name, U.surname, U.type, GROUP_CONCAT(UR.role) as roles
      FROM Users U
      LEFT JOIN UsersRoles UR ON U.id = UR.userId
      WHERE U.type = 'municipality_user'
      GROUP BY U.id
      ORDER BY U.surname ASC, U.name ASC, U.username ASC
    `;
    db.all(sql, [], (err, rows) => {
      if (err) return reject(err);
      // Trasforma roles da stringa a array
      const users = rows.map(row => ({
        ...row,
        roles: row.roles ? row.roles.split(',') : []
      }));
      resolve(users);
    });
  });
};

/**
 * Get all external maintainers
 * @returns {Promise<Object[]>}
 */

//TO UPDATE
exports.getExternalMaintainers = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT U.id, U.username, U.email, U.name, U.surname, U.type, GROUP_CONCAT(UR.role) as roles
      FROM Users U
      INNER JOIN UsersRoles UR ON U.id = UR.userId
      WHERE U.type = 'municipality_user' AND UR.role = 'external_maintainer'
      GROUP BY U.id
      ORDER BY U.surname ASC, U.name ASC, U.username ASC
    `;
    db.all(sql, [], (err, rows) => {
      if (err) return reject(err);
      // Trasforma roles da stringa a array
      const users = rows.map(row => ({
        ...row,
        roles: row.roles ? row.roles.split(',') : []
      }));
      resolve(users);
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
};

/**
 * Verify confirmation code and activate user account
 * @param {string} email - user email
 * @param {string} code - confirmation code
 * @returns {Promise<{ success: boolean, userId?: number, message?: string }>}
 */
exports.confirmUser = (email, code) => {
  return new Promise((resolve, reject) => {
    // First, find the user by email
    const selectSql = `
      SELECT id, username, email, name, is_confirmed, confirmation_code, confirmation_code_expires_at 
      FROM Users 
      WHERE email = ?
    `;
    
    db.get(selectSql, [email], (err, user) => {
      if (err) {
        console.error('Database error in confirmUser:', err);
        reject(err);
        return;
      }
      
      if (!user) {
        resolve({ success: false, message: 'User not found' });
        return;
      }
      
      if (user.is_confirmed === 1) {
        resolve({ success: false, message: 'User is already confirmed' });
        return;
      }
      
      if (!user.confirmation_code) {
        resolve({ success: false, message: 'No confirmation code found for this user' });
        return;
      }
      
      // Compare codes as strings, trimming whitespace
      const dbCode = String(user.confirmation_code).trim();
      const inputCode = String(code).trim();
      
      console.log(`[DEBUG] Confirming user ${email}: dbCode="${dbCode}", inputCode="${inputCode}", match=${dbCode === inputCode}`);
      
      if (dbCode !== inputCode) {
        resolve({ success: false, message: 'Invalid confirmation code' });
        return;
      }
      
      // Check if code is expired
      const now = new Date();
      const expiresAt = new Date(user.confirmation_code_expires_at);
      
      if (now > expiresAt) {
        resolve({ success: false, message: 'Confirmation code has expired' });
        return;
      }
      
      // Update user to set is_confirmed = 1 and clear confirmation code
      const updateSql = `
        UPDATE Users 
        SET is_confirmed = 1, 
            confirmation_code = NULL, 
            confirmation_code_expires_at = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      db.run(updateSql, [user.id], function (updateErr) {
        if (updateErr) {
          console.error('Database error updating user confirmation:', updateErr);
          reject(updateErr);
          return;
        }
        
        console.log(`[DEBUG] Successfully confirmed user ${email} (ID: ${user.id})`);
        resolve({ 
          success: true, 
          userId: user.id,
          message: 'Account successfully confirmed' 
        });
      });
    });
  });
};

/**
 * Resend confirmation code (generate a new one)
 * @param {string} email - user email
 * @returns {Promise<{ success: boolean, confirmationCode?: string, message?: string }>}
 */
exports.resendConfirmationCode = (email) => {
  return new Promise((resolve, reject) => {
    const selectSql = `
      SELECT id, email, name, is_confirmed 
      FROM Users 
      WHERE email = ?
    `;
    
    db.get(selectSql, [email], (err, user) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!user) {
        resolve({ success: false, message: 'User not found' });
        return;
      }
      
      if (user.is_confirmed === 1) {
        resolve({ success: false, message: 'User is already confirmed' });
        return;
      }
      
      // Generate new confirmation code
      const newCode = generateConfirmationCode();
      const expiryDate = new Date(Date.now() + 30 * 60 * 1000);
      const confirmationExpiresAt = expiryDate.toISOString();
      
      const updateSql = `
        UPDATE Users 
        SET confirmation_code = ?,
            confirmation_code_expires_at = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      db.run(updateSql, [newCode, confirmationExpiresAt, user.id], function (updateErr) {
        if (updateErr) {
          reject(updateErr);
          return;
        }
        
        resolve({ 
          success: true, 
          confirmationCode: newCode,
          email: user.email,
          name: user.name,
          message: 'New confirmation code generated' 
        });
      });
    });
  });
};

exports.deleteRoleFromUser = (userId, role) => {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM UsersRoles WHERE userId = ? AND role = ?';
    db.run(sql, [userId, role], function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this.changes);
    });
  });
};

exports.addRoleToUser = (userId, role) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO UsersRoles (userId, role) VALUES (?, ?)';
    db.run(sql, [userId, role], function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this.lastID);
    });
  });
};