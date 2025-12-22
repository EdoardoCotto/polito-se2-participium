"use strict";

// Unit tests for server/dao/streetDao.js using an inline sqlite3 mock

const mockDb = {
  get: jest.fn(),
  run: jest.fn(),
  all: jest.fn(),
};

jest.mock('sqlite3', () => ({
  Database: jest.fn(() => mockDb),
}));

const dao = require('../../server/dao/streetDao');

describe('streetDao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getStreetByName resolves row', async () => {
    mockDb.get.mockImplementation((_sql, _params, cb) => cb(null, { id: 1, street_name: 'Via Roma' }));
    const row = await dao.getStreetByName('Via Roma');
    expect(row.street_name).toBe('Via Roma');
    expect(mockDb.get).toHaveBeenCalled();
  });

  test('getStreetByName rejects on error', async () => {
    mockDb.get.mockImplementation((_sql, _params, cb) => cb(new Error('db-get')));
    await expect(dao.getStreetByName('X')).rejects.toThrow('db-get');
  });

  test('updateStreetGeocoding resolves', async () => {
    mockDb.run.mockImplementation((_sql, _params, cb) => cb(null));
    await expect(
      dao.updateStreetGeocoding(5, { latitude: 1, longitude: 2, min_lat: 0, max_lat: 2, min_lon: 0, max_lon: 2, geometry: 'g' })
    ).resolves.toBeUndefined();
    expect(mockDb.run).toHaveBeenCalled();
  });

  test('updateStreetGeocoding rejects on error', async () => {
    mockDb.run.mockImplementation((_sql, _params, cb) => cb(new Error('db-run')));
    await expect(
      dao.updateStreetGeocoding(5, { latitude: 1, longitude: 2, min_lat: 0, max_lat: 2, min_lon: 0, max_lon: 2, geometry: 'g' })
    ).rejects.toThrow('db-run');
  });

  test('searchStreets resolves rows', async () => {
    mockDb.all.mockImplementation((_sql, _params, cb) => cb(null, [{ street_name: 'A' }, { street_name: 'B' }]))
    const rows = await dao.searchStreets('V');
    expect(rows.length).toBe(2);
    expect(mockDb.all).toHaveBeenCalled();
  });

  test('searchStreets rejects on error', async () => {
    mockDb.all.mockImplementation((_sql, _params, cb) => cb(new Error('db-all')));
    await expect(dao.searchStreets('V')).rejects.toThrow('db-all');
  });
});
