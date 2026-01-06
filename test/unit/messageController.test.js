"use strict";

jest.mock('../../server/repository/messageRepository');
const messageRepository = require('../../server/repository/messageRepository');
const AppError = require('../../server/errors/AppError');

const controller = require('../../server/controller/messageController');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('messageController', () => {
  beforeEach(() => jest.resetAllMocks());

  test('createMessage returns 201 on success', async () => {
    messageRepository.addMessage.mockResolvedValue({ id: 1 });
    const req = { params: { id: '10' }, body: { message: 'hi' }, user: { id: 1, role: 'citizen' } };
    const res = makeRes();
    await controller.createMessage(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 1 });
  });

  test('createMessage maps AppError to status code', async () => {
    messageRepository.addMessage.mockRejectedValue(new AppError('bad', 400));
    const req = { params: { id: '10' }, body: { message: 'x' }, user: { id: 1 } };
    const res = makeRes();
    await controller.createMessage(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'bad' });
  });

  test('createMessage returns 500 on unknown error', async () => {
    messageRepository.addMessage.mockRejectedValue(new Error('boom'));
    const req = { params: { id: '10' }, body: { message: 'x' }, user: { id: 1 } };
    const res = makeRes();
    await controller.createMessage(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('getMessages returns 200 on success', async () => {
    messageRepository.getMessages.mockResolvedValue([{ id: 1 }]);
    const req = { params: { id: '10' }, user: { id: 1, role: 'citizen' } };
    const res = makeRes();
    await controller.getMessages(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
  });

  test('getMessages maps AppError', async () => {
    messageRepository.getMessages.mockRejectedValue(new AppError('nope', 403));
    const req = { params: { id: '10' }, user: { id: 2, role: 'citizen' } };
    const res = makeRes();
    await controller.getMessages(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'nope' });
  });

  test('getMessages returns 500 on unknown error', async () => {
    messageRepository.getMessages.mockRejectedValue(new Error('err'));
    const req = { params: { id: '10' }, user: { id: 2, role: 'citizen' } };
    const res = makeRes();
    await controller.getMessages(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
