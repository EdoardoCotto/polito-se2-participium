// __mocks__/sqlite3.js
"use strict";

const mockGet = jest.fn();
const mockRun = jest.fn();
const mockAll = jest.fn();

const Database = jest.fn().mockImplementation((path, callback) => {
  if (callback) {
    // Simula callback asincrono
    process.nextTick(() => callback(null));
  }
  return {
    get: mockGet,
    run: mockRun,
    all: mockAll,
    exec: (sql, cb) => {
      const statements = String(sql)
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length);
      const runSequentially = async () => {
        for (const stmt of statements) {
          await new Promise((res, rej) => mockRun(stmt, (err) => (err ? rej(err) : res())));
        }
      };
      runSequentially().then(() => cb && cb(null)).catch(err => cb && cb(err));
    },
    serialize: (fn) => { if (typeof fn === 'function') fn(); },
    close: (fn) => { if (typeof fn === 'function') process.nextTick(() => fn(null)); }
  };
});

// Espone i mock per accedervi nei test
Database.mockGet = mockGet;
Database.mockRun = mockRun;
Database.mockAll = mockAll;

function verbose() {
  return module.exports;
}

module.exports = { Database, verbose };