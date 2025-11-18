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
    all: mockAll
  };
});

// Espone i mock per accedervi nei test
Database.mockGet = mockGet;
Database.mockRun = mockRun;
Database.mockAll = mockAll;

module.exports = { Database };