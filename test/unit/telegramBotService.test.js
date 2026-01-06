"use strict";

// Mock DAOs and repository
jest.mock('../../server/dao/userDao');
jest.mock('../../server/repository/reportRepository');

const userDao = require('../../server/dao/userDao');
const reportRepository = require('../../server/repository/reportRepository');
const NotFoundError = require('../../server/errors/NotFoundError');

// Custom mock for node-telegram-bot-api capturing handlers
jest.mock('node-telegram-bot-api', () => {
  return function TelegramBot() {
    const handlers = { onText: [], on: [], messages: [] };
    const bot = {
      setMyCommands: jest.fn(() => Promise.resolve(true)),
      onText: jest.fn((regex, cb) => { handlers.onText.push({ regex, cb }); }),
      on: jest.fn((event, cb) => { handlers.on.push({ event, cb }); }),
      sendMessage: jest.fn(async (chatId, text) => { handlers.messages.push({ chatId, text }); return { message_id: 1 }; }),
      processUpdate: jest.fn(),
      getMe: jest.fn(() => Promise.resolve({ id: 123, username: 'mock_bot' })),
      setWebHook: jest.fn(() => Promise.resolve(true)),
      getFile: jest.fn(() => Promise.resolve({ file_path: 'mock/file.jpg' })),
      token: 'mock-token',
      _handlers: handlers,
    };
    return bot;
  };
}, { virtual: true });

const service = require('../../server/services/telegramBotService');

describe('telegramBotService /reportstatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('invalid username prompts setup message', async () => {
    const bot = service.initializeBot('token');
    const call = bot.onText.mock.calls.find(([regex]) => /\/reportstatus/.test(regex.source));
    const h = { cb: call && call[1] };
    const msg = { chat: { id: 1 }, from: { username: undefined } };
    await h.cb(msg, ['reportstatus', '123']);
    expect(bot.sendMessage).toHaveBeenCalledWith(1, expect.stringContaining('Please set a username'));
  });

  test('invalid report id sends error message', async () => {
    const bot = service.initializeBot('token');
    const call = bot.onText.mock.calls.find(([regex]) => /\/reportstatus/.test(regex.source));
    const h = { cb: call && call[1] };
    const msg = { chat: { id: 2 }, from: { username: 'john' } };
    await h.cb(msg, ['reportstatus', undefined]);
    expect(bot.sendMessage).toHaveBeenCalledWith(2, expect.stringContaining('Invalid report ID'));
  });

  test('NotFoundError maps to not-found message', async () => {
    userDao.getUserByTelegramNickname.mockResolvedValue({ id: 10 });
    reportRepository.getReportById.mockRejectedValue(new NotFoundError('not found'));

    const bot = service.initializeBot('token');
    const call = bot.onText.mock.calls.find(([regex]) => /\/reportstatus/.test(regex.source));
    const h = { cb: call && call[1] };
    const msg = { chat: { id: 3 }, from: { username: 'john' } };
    await h.cb(msg, ['reportstatus', '99']);
    expect(bot.sendMessage).toHaveBeenCalledWith(3, '❌ Report #99 not found.');
  });

  test('authorization check denies viewing others reports', async () => {
    userDao.getUserByTelegramNickname.mockResolvedValue({ id: 10 });
    reportRepository.getReportById.mockResolvedValue({ id: 5, userId: 11, status: 'pending', title: 't', description: 'd', category: 'c', latitude: 45, longitude: 7, photos: [], created_at: Date.now(), updated_at: Date.now() });

    const bot = service.initializeBot('token');
    const call = bot.onText.mock.calls.find(([regex]) => /\/reportstatus/.test(regex.source));
    const h = { cb: call && call[1] };
    const msg = { chat: { id: 4 }, from: { username: 'john' } };
    await h.cb(msg, ['reportstatus', '5']);
    expect(bot.sendMessage).toHaveBeenCalledWith(4, expect.stringContaining('not authorized'));
  });

  test('success path sends detailed report info', async () => {
    userDao.getUserByTelegramNickname.mockResolvedValue({ id: 10 });
    reportRepository.getReportById.mockResolvedValue({ id: 6, userId: 10, status: 'pending', title: 'Title', description: 'Desc', category: 'Roads', latitude: 45.0703, longitude: 7.6869, photos: ['a'], created_at: Date.now(), updated_at: Date.now(), rejection_reason: null, technical_office: 'Urban' });

    const bot = service.initializeBot('token');
    const call = bot.onText.mock.calls.find(([regex]) => /\/reportstatus/.test(regex.source));
    const h = { cb: call && call[1] };
    const msg = { chat: { id: 5 }, from: { username: 'john' } };
    await h.cb(msg, ['reportstatus', '6']);
    const last = bot.sendMessage.mock.calls.pop();
    expect(last[0]).toBe(5);
    expect(last[1]).toContain('Report Details #6');
    expect(last[1]).toContain('Title: Title');
    expect(last[1]).toContain('Status:');
  });
});

describe('telegramBotService initialize webhook', () => {
  test('sets webhook when url provided', async () => {
    const bot = service.initializeBot('token', 'https://example.com/webhook');
    expect(bot.setWebHook).toHaveBeenCalledWith('https://example.com/webhook');
  });
});

describe('telegramBotService other commands', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('/start sends welcome', async () => {
    const bot = service.initializeBot('token');
    const call = bot.onText.mock.calls.find(([regex]) => /\/start/.test(regex.source));
    const h = { cb: call && call[1] };
    const msg = { chat: { id: 9 } };
    await h.cb(msg);
    expect(bot.sendMessage).toHaveBeenCalledWith(9, expect.stringContaining('Welcome to Participium'));
  });

  test('/help sends commands list', async () => {
    const bot = service.initializeBot('token');
    const call = bot.onText.mock.calls.find(([regex]) => /\/help/.test(regex.source));
    const h = { cb: call && call[1] };
    const msg = { chat: { id: 10 } };
    await h.cb(msg);
    expect(bot.sendMessage).toHaveBeenCalledWith(10, expect.stringContaining('Available Commands'));
  });

  test('/myreports without username prompts setup', async () => {
    const bot = service.initializeBot('token');
    const call = bot.onText.mock.calls.find(([regex]) => /\/myreports/.test(regex.source));
    const h = { cb: call && call[1] };
    const msg = { chat: { id: 11 }, from: { username: undefined } };
    await h.cb(msg);
    expect(bot.sendMessage).toHaveBeenCalledWith(11, expect.stringContaining('Please set a username'));
  });

  test('/myreports with no reports informs user', async () => {
    userDao.getUserByTelegramNickname.mockResolvedValue({ id: 77 });
    reportRepository.getUserReports.mockResolvedValue([]);
    const bot = service.initializeBot('token');
    const call = bot.onText.mock.calls.find(([regex]) => /\/myreports/.test(regex.source));
    const h = { cb: call && call[1] };
    const msg = { chat: { id: 12 }, from: { username: 'john' } };
    await h.cb(msg);
    expect(bot.sendMessage).toHaveBeenCalledWith(12, expect.stringContaining("haven't submitted any reports"));
  });

  test('/myreports with one report lists details', async () => {
    userDao.getUserByTelegramNickname.mockResolvedValue({ id: 77 });
    reportRepository.getUserReports.mockResolvedValue([{ id: 5, title: 't', status: 'pending', created_at: Date.now() }]);
    const bot = service.initializeBot('token');
    const call = bot.onText.mock.calls.find(([regex]) => /\/myreports/.test(regex.source));
    const h = { cb: call && call[1] };
    const msg = { chat: { id: 13 }, from: { username: 'john' } };
    await h.cb(msg);
    const last = bot.sendMessage.mock.calls.pop();
    expect(last[0]).toBe(13);
    expect(last[1]).toContain('Your Reports');
    expect(last[1]).toContain('ID: #5');
  });

  test('/newreport without username prompts setup', async () => {
    const bot = service.initializeBot('token');
    const call = bot.onText.mock.calls.find(([regex]) => /\/newreport/.test(regex.source));
    const h = { cb: call && call[1] };
    const msg = { chat: { id: 14 }, from: { username: undefined } };
    await h.cb(msg);
    expect(bot.sendMessage).toHaveBeenCalledWith(14, expect.stringContaining('Please set a username'));
  });

  test('/newreport with linked user starts flow', async () => {
    userDao.getUserByTelegramNickname.mockResolvedValue({ id: 42 });
    const bot = service.initializeBot('token');
    const call = bot.onText.mock.calls.find(([regex]) => /\/newreport/.test(regex.source));
    const h = { cb: call && call[1] };
    const msg = { chat: { id: 15 }, from: { username: 'john' } };
    await h.cb(msg);
    const last = bot.sendMessage.mock.calls.pop();
    expect(last[0]).toBe(15);
    expect(last[1]).toEqual(expect.stringContaining("Let's create a new report!"));
  });
});
