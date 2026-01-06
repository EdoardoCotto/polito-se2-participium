"use strict";

// sqlite3 is mapped to our mock via jest config; require after resetModules to share instance
let Database;
let notificationDao;

describe('notificationDao', () => {
  beforeEach(() => {
    jest.resetModules();
    ({ Database } = require('sqlite3'));
    Database.mockGet.mockReset();
    Database.mockRun.mockReset();
    Database.mockAll.mockReset();
    notificationDao = require('../../server/dao/notificationDao');
  });

  test('createNotification inserts and returns created row', async () => {
    Database.mockRun.mockImplementation((_s, _p, cb) => cb.call({ lastID: 77, changes: 1 }, null));
    const row = { id: 77, userId: 1, title: 't', message: 'm' };
    Database.mockGet.mockImplementation((_s, _p, cb) => cb(null, row));

    const result = await notificationDao.createNotification({ userId: 1, reportId: null, title: 't', message: 'm' });
    expect(result).toEqual(row);
    expect(Database.mockRun).toHaveBeenCalled();
    expect(Database.mockGet).toHaveBeenCalled();
  });

  test('getNotificationsByUserId returns rows', async () => {
    const rows = [{ id: 1 }, { id: 2 }];
    Database.mockAll.mockImplementation((_s, _p, cb) => cb(null, rows));
    const result = await notificationDao.getNotificationsByUserId(1);
    expect(result).toEqual(rows);
  });

  test('getUnreadNotificationsByUserId returns rows', async () => {
    const rows = [{ id: 3 }];
    Database.mockAll.mockImplementation((_s, _p, cb) => cb(null, rows));
    const result = await notificationDao.getUnreadNotificationsByUserId(1);
    expect(result).toEqual(rows);
  });

  test('markNotificationAsRead updates and returns row', async () => {
    Database.mockRun.mockImplementation((_s, _p, cb) => cb.call({ changes: 1 }, null));
    const row = { id: 10, is_read: 1 };
    Database.mockGet.mockImplementation((_s, _p, cb) => cb(null, row));
    const result = await notificationDao.markNotificationAsRead(10, 1);
    expect(result).toEqual(row);
  });

  test('markNotificationAsRead returns null when no changes', async () => {
    Database.mockRun.mockImplementation((_s, _p, cb) => cb.call({ changes: 0 }, null));
    const result = await notificationDao.markNotificationAsRead(10, 1);
    expect(result).toBeNull();
  });

  test('markAllNotificationsAsRead returns change count', async () => {
    Database.mockRun.mockImplementation((_s, _p, cb) => cb.call({ changes: 5 }, null));
    const result = await notificationDao.markAllNotificationsAsRead(1);
    expect(result).toBe(5);
  });

  test('deleteNotification returns true when deleted', async () => {
    Database.mockRun.mockImplementation((_s, _p, cb) => cb.call({ changes: 1 }, null));
    const result = await notificationDao.deleteNotification(11, 1);
    expect(result).toBe(true);
  });

  test('deleteNotification returns false when no changes', async () => {
    Database.mockRun.mockImplementation((_s, _p, cb) => cb.call({ changes: 0 }, null));
    const result = await notificationDao.deleteNotification(11, 1);
    expect(result).toBe(false);
  });

  // Error-path coverage
  test('createNotification rejects when insert fails', async () => {
    Database.mockRun.mockImplementation((_s, _p, cb) => cb.call({}, new Error('insert-error')));
    await expect(notificationDao.createNotification({ userId: 1, title: 't', message: 'm' })).rejects.toThrow('insert-error');
  });

  test('createNotification rejects when select fails', async () => {
    Database.mockRun.mockImplementation((_s, _p, cb) => cb.call({ lastID: 99 }, null));
    Database.mockGet.mockImplementation((_s, _p, cb) => cb(new Error('select-error')));
    await expect(notificationDao.createNotification({ userId: 1, title: 't', message: 'm' })).rejects.toThrow('select-error');
  });

  test('getNotificationsByUserId rejects on db error', async () => {
    Database.mockAll.mockImplementation((_s, _p, cb) => cb(new Error('list-error')));
    await expect(notificationDao.getNotificationsByUserId(1)).rejects.toThrow('list-error');
  });

  test('getUnreadNotificationsByUserId rejects on db error', async () => {
    Database.mockAll.mockImplementation((_s, _p, cb) => cb(new Error('list-unread-error')));
    await expect(notificationDao.getUnreadNotificationsByUserId(1)).rejects.toThrow('list-unread-error');
  });

  test('markNotificationAsRead rejects on update error', async () => {
    Database.mockRun.mockImplementation((_s, _p, cb) => cb.call({}, new Error('update-error')));
    await expect(notificationDao.markNotificationAsRead(10, 1)).rejects.toThrow('update-error');
  });

  test('markNotificationAsRead rejects when select fails after update', async () => {
    Database.mockRun.mockImplementation((_s, _p, cb) => cb.call({ changes: 1 }, null));
    Database.mockGet.mockImplementation((_s, _p, cb) => cb(new Error('select-after-update-error')));
    await expect(notificationDao.markNotificationAsRead(10, 1)).rejects.toThrow('select-after-update-error');
  });

  test('markAllNotificationsAsRead rejects on update error', async () => {
    Database.mockRun.mockImplementation((_s, _p, cb) => cb.call({}, new Error('update-all-error')));
    await expect(notificationDao.markAllNotificationsAsRead(1)).rejects.toThrow('update-all-error');
  });

  test('deleteNotification rejects on delete error', async () => {
    Database.mockRun.mockImplementation((_s, _p, cb) => cb.call({}, new Error('delete-error')));
    await expect(notificationDao.deleteNotification(11, 1)).rejects.toThrow('delete-error');
  });
});
