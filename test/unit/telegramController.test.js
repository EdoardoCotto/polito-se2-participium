"use strict";

jest.mock('../../server/services/telegramBotService');
const telegramBotService = require('../../server/services/telegramBotService');
const controller = require('../../server/controller/telegramController');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('telegramController', () => {
  beforeEach(() => jest.resetAllMocks());

  test('handleWebhook processes update and returns ok', async () => {
    const res = makeRes();
    telegramBotService.processWebhookUpdate = jest.fn();
    await controller.handleWebhook({ body: { update_id: 1 } }, res);
    expect(telegramBotService.processWebhookUpdate).toHaveBeenCalledWith({ update_id: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  test('handleWebhook still returns ok on error', async () => {
    const res = makeRes();
    telegramBotService.processWebhookUpdate = jest.fn(() => { throw new Error('fail'); });
    await controller.handleWebhook({ body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: false }));
  });

  test('getBotInfo returns 503 when bot not initialized', async () => {
    const res = makeRes();
    telegramBotService.getBot = jest.fn(() => null);
    await controller.getBotInfo({}, res);
    expect(res.status).toHaveBeenCalledWith(503);
  });

  test('getBotInfo returns data when initialized', async () => {
    const res = makeRes();
    const bot = { getMe: jest.fn().mockResolvedValue({ id: 1, username: 'bot', first_name: 'B', is_bot: true }) };
    telegramBotService.getBot = jest.fn(() => bot);
    await controller.getBotInfo({}, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true, bot: { id: 1, username: 'bot', first_name: 'B', is_bot: true } });
  });
});
