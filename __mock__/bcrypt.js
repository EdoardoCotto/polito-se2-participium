"use strict";

// Jest mock for bcrypt used in unit tests
// Default behaviors can be overridden in tests via require('bcrypt').method.mockImplementation(...)

module.exports = {
  compare: jest.fn((pw, hash, cb) => cb(null, false)),
  genSalt: jest.fn(() => Promise.resolve('mock_salt')),
  hash: jest.fn(() => Promise.resolve('mock_hash')),
};
