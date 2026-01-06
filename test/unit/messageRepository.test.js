"use strict";

jest.mock('../../server/dao/reportDao');
jest.mock('../../server/dao/messageDao');

const reportDao = require('../../server/dao/reportDao');
const messageDao = require('../../server/dao/messageDao');
const messageRepository = require('../../server/repository/messageRepository');
const BadRequestError = require('../../server/errors/BadRequestError');
const NotFoundError = require('../../server/errors/NotFoundError');
const UnauthorizedError = require('../../server/errors/UnauthorizedError');

const makeReport = (overrides = {}) => ({
  id: 10,
  userId: 1,
  officerId: 2,
  external_maintainerId: 3,
  ...overrides,
});

describe('messageRepository.addMessage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('throws BadRequest on invalid reportId', async () => {
    await expect(messageRepository.addMessage(undefined, 1, 'hi', 'citizen')).rejects.toThrow(BadRequestError);
  });

  test('throws BadRequest on empty text', async () => {
    await expect(messageRepository.addMessage(10, 1, '   ', 'citizen')).rejects.toThrow(BadRequestError);
  });

  test('throws NotFound when report missing', async () => {
    reportDao.getReportById.mockResolvedValue(null);
    await expect(messageRepository.addMessage(10, 1, 'x', 'citizen')).rejects.toThrow(NotFoundError);
  });

  test('throws Unauthorized when user not authorized', async () => {
    reportDao.getReportById.mockResolvedValue(makeReport({ userId: 99, officerId: 98, external_maintainerId: 97 }));
    await expect(messageRepository.addMessage(10, 1, 'x', 'citizen')).rejects.toThrow(UnauthorizedError);
  });

  test('allows owner to post', async () => {
    reportDao.getReportById.mockResolvedValue(makeReport({ userId: 1 }));
    messageDao.createMessage.mockResolvedValue({ id: 5, message: 'x' });
    const res = await messageRepository.addMessage(10, 1, 'x', 'citizen');
    expect(res).toEqual({ id: 5, message: 'x' });
  });

  test('allows assigned officer to post', async () => {
    reportDao.getReportById.mockResolvedValue(makeReport({ officerId: 5 }));
    messageDao.createMessage.mockResolvedValue({ id: 6 });
    const res = await messageRepository.addMessage(10, 5, 'x', 'municipality_user');
    expect(res.id).toBe(6);
  });

  test('allows assigned external maintainer to post', async () => {
    reportDao.getReportById.mockResolvedValue(makeReport({ external_maintainerId: 7 }));
    messageDao.createMessage.mockResolvedValue({ id: 7 });
    const res = await messageRepository.addMessage(10, 7, 'x', 'municipality_user');
    expect(res.id).toBe(7);
  });

  test('allows admin to post', async () => {
    reportDao.getReportById.mockResolvedValue(makeReport());
    messageDao.createMessage.mockResolvedValue({ id: 8 });
    const res = await messageRepository.addMessage(10, 99, 'x', 'admin');
    expect(res.id).toBe(8);
  });
});

describe('messageRepository.getMessages', () => {
  beforeEach(() => jest.resetAllMocks());

  test('throws BadRequest on invalid id', async () => {
    await expect(messageRepository.getMessages(undefined, 1, 'citizen')).rejects.toThrow(BadRequestError);
  });

  test('throws NotFound when report missing', async () => {
    reportDao.getReportById.mockResolvedValue(null);
    await expect(messageRepository.getMessages(10, 1, 'citizen')).rejects.toThrow(NotFoundError);
  });

  test('throws Unauthorized when citizen not owner', async () => {
    reportDao.getReportById.mockResolvedValue(makeReport({ userId: 2 }));
    await expect(messageRepository.getMessages(10, 1, 'citizen')).rejects.toThrow(UnauthorizedError);
  });

  test('returns messages for owner', async () => {
    reportDao.getReportById.mockResolvedValue(makeReport({ userId: 1 }));
    messageDao.getMessagesByReportId.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const rows = await messageRepository.getMessages(10, 1, 'citizen');
    expect(rows).toHaveLength(2);
  });

  test('returns messages for staff', async () => {
    reportDao.getReportById.mockResolvedValue(makeReport({ userId: 3 }));
    messageDao.getMessagesByReportId.mockResolvedValue([{ id: 1 }]);
    const rows = await messageRepository.getMessages(10, 5, 'municipality_user');
    expect(rows).toHaveLength(1);
  });
});
