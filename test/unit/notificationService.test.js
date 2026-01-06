"use strict";

jest.mock('../../server/dao/notificationDao', () => ({
  createNotification: jest.fn(),
  getNotificationsByUserId: jest.fn(),
  getUnreadNotificationsByUserId: jest.fn(),
  markNotificationAsRead: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
  deleteNotification: jest.fn(),
}));

jest.mock('../../server/dao/userDao', () => ({
  getUserById: jest.fn(),
}));

jest.mock('../../server/dao/reportDao', () => ({
  getReportById: jest.fn(),
}));

jest.mock('../../server/services/emailService', () => ({
  sendNotificationEmail: jest.fn(),
}));

const notificationDao = require('../../server/dao/notificationDao');
const userDao = require('../../server/dao/userDao');
const reportDao = require('../../server/dao/reportDao');
const emailService = require('../../server/services/emailService');
const REPORT_STATUSES = require('../../server/constants/reportStatus');

const notificationService = require('../../server/services/notificationService');

describe('notificationService', () => {
  const report = { id: 10, title: 'Road Pothole', userId: 1 };
  const citizen = { id: 1, email: 'citizen@example.com', mail_notifications: 1 };

  beforeEach(() => {
    jest.resetAllMocks();
    reportDao.getReportById.mockResolvedValue(report);
    userDao.getUserById.mockResolvedValue(citizen);
    notificationDao.createNotification.mockResolvedValue({ id: 99 });
    emailService.sendNotificationEmail.mockResolvedValue(true);
  });

  test('createStatusChangeNotification handles REJECTED with reason', async () => {
    await notificationService.createStatusChangeNotification(report.id, REPORT_STATUSES.REJECTED, REPORT_STATUSES.PENDING, 'Not valid');
    expect(notificationDao.createNotification).toHaveBeenCalled();
    const args = notificationDao.createNotification.mock.calls[0][0];
    expect(args.title).toContain('Rejected');
    expect(args.message).toContain('Reason: Not valid');
    expect(emailService.sendNotificationEmail).toHaveBeenCalledWith(citizen.email, expect.any(String), expect.stringContaining('Rejected'));
  });

  test('createStatusChangeNotification handles ASSIGNED message', async () => {
    await notificationService.createStatusChangeNotification(report.id, REPORT_STATUSES.ASSIGNED, REPORT_STATUSES.PENDING);
    const args = notificationDao.createNotification.mock.calls[0][0];
    expect(args.title).toContain('Assigned');
    expect(args.message).toContain('assigned to a technical office');
  });

  test('createStatusChangeNotification handles PROGRESS message', async () => {
    await notificationService.createStatusChangeNotification(report.id, REPORT_STATUSES.PROGRESS, REPORT_STATUSES.ASSIGNED);
    const args = notificationDao.createNotification.mock.calls[0][0];
    expect(args.title).toContain('In Progress');
    expect(args.message).toContain('Work on your report has started');
  });

  test('createStatusChangeNotification handles SUSPENDED message', async () => {
    await notificationService.createStatusChangeNotification(report.id, REPORT_STATUSES.SUSPENDED, REPORT_STATUSES.PROGRESS);
    const args = notificationDao.createNotification.mock.calls[0][0];
    expect(args.title).toContain('Suspended');
    expect(args.message).toContain('temporarily suspended');
  });

  test('createStatusChangeNotification handles RESOLVED message', async () => {
    await notificationService.createStatusChangeNotification(report.id, REPORT_STATUSES.RESOLVED, REPORT_STATUSES.PROGRESS);
    const args = notificationDao.createNotification.mock.calls[0][0];
    expect(args.title).toContain('Resolved');
    expect(args.message).toContain('has been resolved');
  });

  test('createStatusChangeNotification skips when report not found', async () => {
    reportDao.getReportById.mockResolvedValueOnce(null);
    await notificationService.createStatusChangeNotification(999, REPORT_STATUSES.RESOLVED, REPORT_STATUSES.PENDING);
    expect(notificationDao.createNotification).not.toHaveBeenCalled();
    expect(emailService.sendNotificationEmail).not.toHaveBeenCalled();
  });

  test('createStatusChangeNotification skips when report has no userId', async () => {
    reportDao.getReportById.mockResolvedValueOnce({ id: 10, title: 'X', userId: null });
    await notificationService.createStatusChangeNotification(10, REPORT_STATUSES.RESOLVED, REPORT_STATUSES.PENDING);
    expect(notificationDao.createNotification).not.toHaveBeenCalled();
  });

  test('createStatusChangeNotification skips when citizen not found', async () => {
    userDao.getUserById.mockResolvedValueOnce(null);
    await notificationService.createStatusChangeNotification(report.id, REPORT_STATUSES.RESOLVED, REPORT_STATUSES.PENDING);
    expect(notificationDao.createNotification).not.toHaveBeenCalled();
  });

  test('createStatusChangeNotification does not send email when mail_notifications disabled', async () => {
    userDao.getUserById.mockResolvedValueOnce({ id: 1, email: 'citizen@example.com', mail_notifications: 0 });
    await notificationService.createStatusChangeNotification(report.id, REPORT_STATUSES.RESOLVED, REPORT_STATUSES.PENDING);
    expect(emailService.sendNotificationEmail).not.toHaveBeenCalled();
  });

  test('createStatusChangeNotification catches createNotification error and does not throw', async () => {
    notificationDao.createNotification.mockRejectedValueOnce(new Error('db-error'));
    await notificationService.createStatusChangeNotification(report.id, REPORT_STATUSES.ASSIGNED, REPORT_STATUSES.PENDING);
    expect(emailService.sendNotificationEmail).not.toHaveBeenCalled();
  });

  test('getUserNotifications proxies to dao', async () => {
    notificationDao.getNotificationsByUserId.mockResolvedValueOnce([{ id: 1 }]);
    const res = await notificationService.getUserNotifications(1);
    expect(res).toEqual([{ id: 1 }]);
  });

  test('getUnreadNotifications proxies to dao', async () => {
    notificationDao.getUnreadNotificationsByUserId.mockResolvedValueOnce([{ id: 2 }]);
    const res = await notificationService.getUnreadNotifications(1);
    expect(res).toEqual([{ id: 2 }]);
  });

  test('markAsRead proxies to dao', async () => {
    notificationDao.markNotificationAsRead.mockResolvedValueOnce({ id: 3, is_read: 1 });
    const res = await notificationService.markAsRead(3, 1);
    expect(res).toEqual({ id: 3, is_read: 1 });
  });

  test('markAllAsRead proxies to dao', async () => {
    notificationDao.markAllNotificationsAsRead.mockResolvedValueOnce(5);
    const res = await notificationService.markAllAsRead(1);
    expect(res).toBe(5);
  });

  test('deleteNotification proxies to dao', async () => {
    notificationDao.deleteNotification.mockResolvedValueOnce(true);
    const res = await notificationService.deleteNotification(11, 1);
    expect(res).toBe(true);
  });
});
