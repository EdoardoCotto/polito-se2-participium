"use strict";

const sqlite = require('sqlite3');
const path = require('node:path');

// Connessione al database
const dbPath = path.join(__dirname, '..', 'db', 'participium.db');
const db = new sqlite.Database(dbPath, (err) => {
  if (err) throw new Error("DB Connection Fail");
});

/**
 * Create a new notification
 * @param {{ userId: number, reportId?: number, title: string, message: string }} notificationData
 * @returns {Promise<Object>}
 */
exports.createNotification = ({ userId, reportId = null, title, message }) => {
  return new Promise((resolve, reject) => {
    const insertSql = `INSERT INTO Notifications (userId, reportId, title, message)
                       VALUES (?, ?, ?, ?)`;
    db.run(
      insertSql,
      [userId, reportId, title, message],
      function (insertErr) {
        if (insertErr) {
          return reject(insertErr);
        }
        // Restituiamo la notifica creata
        db.get('SELECT * FROM Notifications WHERE id = ?', [this.lastID], (err2, row) => {
          if (err2) {
            return reject(err2);
          }
          resolve(row);
        });
      }
    );
  });
};

/**
 * Get all notifications for a user
 * @param {number} userId
 * @returns {Promise<Object[]>}
 */
exports.getNotificationsByUserId = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM Notifications 
                 WHERE userId = ? 
                 ORDER BY created_at DESC`;
    db.all(sql, [userId], (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows || []);
    });
  });
};

/**
 * Get unread notifications for a user
 * @param {number} userId
 * @returns {Promise<Object[]>}
 */
exports.getUnreadNotificationsByUserId = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM Notifications 
                 WHERE userId = ? AND is_read = 0 
                 ORDER BY created_at DESC`;
    db.all(sql, [userId], (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows || []);
    });
  });
};

/**
 * Mark a notification as read
 * @param {number} notificationId
 * @param {number} userId
 * @returns {Promise<Object|null>}
 */
exports.markNotificationAsRead = (notificationId, userId) => {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE Notifications 
                 SET is_read = 1 
                 WHERE id = ? AND userId = ?`;
    db.run(sql, [notificationId, userId], function (err) {
      if (err) {
        return reject(err);
      }
      if (this.changes === 0) {
        return resolve(null);
      }
      // Restituiamo la notifica aggiornata
      db.get('SELECT * FROM Notifications WHERE id = ?', [notificationId], (err2, row) => {
        if (err2) {
          return reject(err2);
        }
        resolve(row);
      });
    });
  });
};

/**
 * Mark all notifications as read for a user
 * @param {number} userId
 * @returns {Promise<number>} Number of notifications marked as read
 */
exports.markAllNotificationsAsRead = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE Notifications 
                 SET is_read = 1 
                 WHERE userId = ? AND is_read = 0`;
    db.run(sql, [userId], function (err) {
      if (err) {
        return reject(err);
      }
      resolve(this.changes);
    });
  });
};

/**
 * Delete a notification
 * @param {number} notificationId
 * @param {number} userId
 * @returns {Promise<boolean>}
 */
exports.deleteNotification = (notificationId, userId) => {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM Notifications 
                 WHERE id = ? AND userId = ?`;
    db.run(sql, [notificationId, userId], function (err) {
      if (err) {
        return reject(err);
      }
      resolve(this.changes > 0);
    });
  });
};

