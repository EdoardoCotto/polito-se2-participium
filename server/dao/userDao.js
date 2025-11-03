"use strict";

const sqlite = require('sqlite3');
const bcrypt = require('bcrypt');

// Connessione al database (usa lo stesso file del vostro progetto)
const db = new sqlite.Database('db/participium.db', (err) => {
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
      bcrypt.hash(password, row.salt, (err, hashed) => {
        if (err) {
          reject(err);
          return;
        }

        if (hashed === row.password) {
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
    const sql = 'SELECT id, username, name, surname, type FROM Users WHERE id = ?';
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
 * Create a new user (registration)
 * @param {{ username: string, email: string, name: string, surname: string, password: string, type?: string }} newUser
 * @returns {Promise<{ id: number, username: string, email: string, name: string, surname: string, type: string }>}
 */
exports.createUser = ({ username, email, name, surname, password, type = 'citizen' }) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Check username/email uniqueness
      const existingSql = 'SELECT id FROM Users WHERE username = ? OR email = ?';
      db.get(existingSql, [username, email], async (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        if (row) {
          reject(new Error('Username or email already taken'));
          return;
        }

        // Hash password with salt
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(password, salt);

        const insertSql = `INSERT INTO Users (username, email, name, surname, type, password, salt)
                           VALUES (?, ?, ?, ?, ?, ?, ?)`;
        db.run(insertSql, [username, email, name, surname, type, hash, salt], function (insertErr) {
          if (insertErr) {
            reject(insertErr);
            return;
          }
          resolve({ id: this.lastID, username, email, name, surname, type });
        });
      });
    } catch (e) {
      reject(e);
    }
  });
};
