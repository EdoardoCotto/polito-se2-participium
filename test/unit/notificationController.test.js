"use strict";

jest.mock('../../server/services/notificationService');
const notificationService = require('../../server/services/notificationService');
const AppError = require('../../server/errors/AppError');
const controller = require('../../server/controller/notificationController');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('notificationController', () => {
  beforeEach(() => jest.resetAllMocks());

  test('getNotifications requires auth', async () => {
    const res = makeRes();
    await controller.getNotifications({ user: null }, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('getNotifications returns notifications', async () => {
    notificationService.getUserNotifications.mockResolvedValue([{ id: 1 }]);
    const res = makeRes();
    await controller.getNotifications({ user: { id: 1 } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
  });

  test('getUnreadNotifications returns data', async () => {
    notificationService.getUnreadNotifications.mockResolvedValue([{ id: 2 }]);
    const res = makeRes();
    await controller.getUnreadNotifications({ user: { id: 2 } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('markAsRead validates id and not found', async () => {
    const res = makeRes();
    await controller.markAsRead({ user: { id: 1 }, params: { id: 'x' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);

    notificationService.markAsRead.mockResolvedValue(null);
    const res2 = makeRes();
    await controller.markAsRead({ user: { id: 1 }, params: { id: '10' } }, res2);
    expect(res2.status).toHaveBeenCalledWith(404);
  });

  test('markAsRead success', async () => {
    notificationService.markAsRead.mockResolvedValue({ id: 10, is_read: 1 });
    const res = makeRes();
    await controller.markAsRead({ user: { id: 1 }, params: { id: '10' } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('markAllAsRead success', async () => {
    notificationService.markAllAsRead.mockResolvedValue(5);
    const res = makeRes();
    await controller.markAllAsRead({ user: { id: 1 } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'All notifications marked as read', count: 5 });
  });

  test('markAllAsRead requires auth', async () => {
    const res = makeRes();
    await controller.markAllAsRead({ user: null }, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('markAllAsRead maps AppError', async () => {
    notificationService.markAllAsRead.mockRejectedValue(new AppError('denied', 403));
    const res = makeRes();
    await controller.markAllAsRead({ user: { id: 2 } }, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'denied' });
  });

  test('deleteNotification validates id and not found', async () => {
    const res = makeRes();
    await controller.deleteNotification({ user: { id: 1 }, params: { id: 'x' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);

    notificationService.deleteNotification.mockResolvedValue(false);
    const res2 = makeRes();
    await controller.deleteNotification({ user: { id: 1 }, params: { id: '10' } }, res2);
    expect(res2.status).toHaveBeenCalledWith(404);
  });

  test('deleteNotification success', async () => {
    notificationService.deleteNotification.mockResolvedValue(true);
    const res = makeRes();
    await controller.deleteNotification({ user: { id: 1 }, params: { id: '10' } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('deleteNotification requires auth', async () => {
    const res = makeRes();
    await controller.deleteNotification({ user: null, params: { id: '10' } }, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('deleteNotification maps AppError', async () => {
    notificationService.deleteNotification.mockRejectedValue(new AppError('oops', 400));
    const res = makeRes();
    await controller.deleteNotification({ user: { id: 1 }, params: { id: '10' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'oops' });
  });

  test('getUnreadNotifications requires auth', async () => {
    const res = makeRes();
    await controller.getUnreadNotifications({ user: null }, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('markAsRead maps AppError and unknown error', async () => {
    notificationService.markAsRead.mockRejectedValueOnce(new AppError('bad', 422));
    let res = makeRes();
    await controller.markAsRead({ user: { id: 1 }, params: { id: '1' } }, res);
    expect(res.status).toHaveBeenCalledWith(422);

    notificationService.markAsRead.mockRejectedValueOnce(new Error('boom'));
    res = makeRes();
    await controller.markAsRead({ user: { id: 1 }, params: { id: '1' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('controllers map AppError and unknown errors', async () => {
    const res = makeRes();
    notificationService.getUserNotifications.mockRejectedValue(new AppError('oops', 418));
    await controller.getNotifications({ user: { id: 1 } }, res);
    expect(res.status).toHaveBeenCalledWith(418);

    const res2 = makeRes();
    notificationService.getUnreadNotifications.mockRejectedValue(new Error('boom'));
    await controller.getUnreadNotifications({ user: { id: 1 } }, res2);
    expect(res2.status).toHaveBeenCalledWith(500);
  });
});
