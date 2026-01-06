"use strict";

// sqlite3 is mapped to our mock via jest config; we'll require after resetModules
let Database;
let messageDao;

describe('messageDao', () => {
  beforeEach(() => {
    jest.resetModules();
    ({ Database } = require('sqlite3'));
    Database.mockGet.mockReset();
    Database.mockRun.mockReset();
    Database.mockAll.mockReset();
    messageDao = require('../../server/dao/messageDao');
  });

  test('createMessage inserts and returns row with user details', async () => {
    Database.mockRun.mockImplementation((sql, params, cb) => cb.call({ lastID: 42, changes: 1 }, null));
    const row = {
      id: 42,
      reportId: 10,
      message: 'hello',
      created_at: '2024-01-01',
      senderId: 5,
      name: 'N',
      surname: 'S',
      senderRole: 'citizen',
      personal_photo_path: null,
    };
    Database.mockGet.mockImplementation((_sql, _params, cb) => cb(null, row));

    const result = await messageDao.createMessage(10, 5, 'hello');
    expect(result).toEqual(row);
    expect(Database.mockRun).toHaveBeenCalled();
    expect(Database.mockGet).toHaveBeenCalled();
  });

  test('getMessagesByReportId returns ordered rows', async () => {
    const rows = [
      { id: 1, reportId: 2, message: 'a' },
      { id: 2, reportId: 2, message: 'b' },
    ];
    Database.mockAll.mockImplementation((_sql, _params, cb) => cb(null, rows));

    const result = await messageDao.getMessagesByReportId(2);
    expect(result).toEqual(rows);
    expect(Database.mockAll).toHaveBeenCalled();
  });

  test('createMessage rejects on insert error', async () => {
    Database.mockRun.mockImplementation((_s, _p, cb) => cb.call({}, new Error('insert-fail')));
    await expect(messageDao.createMessage(1, 1, 'x')).rejects.toThrow('insert-fail');
  });
});
