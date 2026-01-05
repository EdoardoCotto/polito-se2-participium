// E2E tests for Telegram bot report status functionality

// Mock TelegramBot FIRST - this must be hoisted before any other requires
// Use jest.mock (hoisted) to ensure it's applied before any module loads
// Create mock bot object that will be shared - use a module-level variable
const mockBotInstance = {
  setMyCommands: jest.fn().mockResolvedValue(true),
  onText: jest.fn(),
  sendMessage: jest.fn().mockResolvedValue({ message_id: 1 }),
  on: jest.fn(),
  processUpdate: jest.fn(),
  getMe: jest.fn().mockResolvedValue({ id: 123, username: 'test_bot' }),
  stopPolling: jest.fn().mockResolvedValue(true),
  stop: jest.fn().mockResolvedValue(true),
  token: 'test-token'
};

jest.mock('node-telegram-bot-api', () => {
  // Return a constructor function that returns the mock bot
  // This prevents the real TelegramBot from being instantiated
  const MockTelegramBot = jest.fn((token, options) => {
    // Always return the mock instance - this prevents real polling from starting
    // The real TelegramBot would start polling here, but we return a mock instead
    return mockBotInstance;
  });
  // Support both default export and named export patterns
  MockTelegramBot.default = MockTelegramBot;
  return MockTelegramBot;
}, { virtual: false }); // Don't use virtual - we want to replace the real module

jest.resetModules();
// Keep real sqlite3 for E2E tests

jest.doMock('node:fs', () => {
  const real = jest.requireActual('node:fs');
  return { ...real, existsSync: () => false, unlinkSync: () => {} };
});
const request = require('supertest');
const path = require('node:path');

async function initializeDatabase() {
  const { resetDatabase } = require('../../server/db/init');
  await resetDatabase();
}

let app;
let userDao;
let reportRepository;
let telegramBotService;
let sentMessages;
let reportStatusHandler;

beforeAll(async () => {
  await initializeDatabase();
  app = require('../../server/index');
  userDao = require('../../server/dao/userDao');
  reportRepository = require('../../server/repository/reportRepository');
  // Get the mock bot instance
  sentMessages = [];
  
  // Update mock bot to capture handlers and messages
  mockBotInstance.onText = jest.fn((pattern, handler) => {
    // Capture the reportstatus handler
    if (pattern.toString().includes('reportstatus')) {
      reportStatusHandler = handler;
    }
  });
  
  mockBotInstance.sendMessage = jest.fn((chatId, text, options) => {
    sentMessages.push({ chatId, text, options });
    return Promise.resolve({ message_id: sentMessages.length });
  });
  
  mockBotInstance.processUpdate = jest.fn((update) => {
    // Simulate processing the update
    if (update.message && update.message.text) {
      const text = update.message.text;
      if (text.startsWith('/reportstatus')) {
        const match = text.match(/\/reportstatus(?:\s+(.+))?/);
        if (match && reportStatusHandler) {
          reportStatusHandler(update.message, match);
        }
      }
    }
  });
  // Now require and initialize the service
  // The mock should prevent real TelegramBot from being instantiated
  telegramBotService = require('../../server/services/telegramBotService');
  
  // Initialize bot - the mock should prevent real polling
  const initializedBot = telegramBotService.initializeBot('test-token');
  
  // Verify the mock was used (the bot should be our mock instance)
  const bot = telegramBotService.getBot();
  if (bot && bot !== mockBotInstance) {
    // If we got a different bot (real one), try to stop it immediately
    console.warn('Warning: Real TelegramBot detected, attempting to stop polling');
    try {
      if (typeof bot.stopPolling === 'function') {
        await bot.stopPolling().catch(() => {});
      }
      if (typeof bot.stop === 'function') {
        await bot.stop().catch(() => {});
      }
    } catch (e) {
      // Ignore errors when stopping
    }
    // Replace with our mock
    telegramBotService.initializeBot('test-token');
  }
  
  // Ensure we're using the mock
  const finalBot = telegramBotService.getBot();
  if (finalBot === mockBotInstance) {
    // Good - we're using the mock
  } else if (finalBot) {
    // Still have a real bot - try one more time to stop it
    try {
      if (typeof finalBot.stopPolling === 'function') {
        await finalBot.stopPolling().catch(() => {});
      }
    } catch (e) {
      // Ignore
    }
  }
  
  // Wait a bit for handlers to be registered
  await new Promise(resolve => setTimeout(resolve, 50));
});

beforeEach(() => {
  sentMessages = [];
  jest.clearAllMocks();
});
afterAll(async () => {
  // Stop polling to prevent async operations after tests complete
  try {
    const bot = telegramBotService.getBot();
    if (bot && typeof bot.stopPolling === 'function') {
      await bot.stopPolling();
    }
    if (bot && typeof bot.stop === 'function') {
      await bot.stop();
    }
    // Also call stopPolling on mock bot instance
    if (mockBotInstance && typeof mockBotInstance.stopPolling === 'function') {
      await mockBotInstance.stopPolling();
    }
  } catch (error) {
    // Ignore cleanup errors
  }
  // Wait a bit to ensure all async operations complete
  await new Promise(resolve => setTimeout(resolve, 100));
});

describe('Telegram Bot - Report Status E2E Tests', () => {
  let citizenUser;
  let citizenUserId;
  let citizenTelegramUsername;
  let reportId;
  let reportIdRejected;
  let reportIdAssigned;

  beforeAll(async () => {
    // Create a citizen user with Telegram nickname
    const timestamp = Date.now();
    const username = `telegram_citizen_${timestamp}`;
    const telegramNickname = `@telegram_user_${timestamp}`;

    citizenUser = await userDao.createUser({
      username: username,
      email: `${username}@example.com`,
      name: 'Telegram',
      surname: 'User',
      password: 'Password123!',
      skipConfirmation: true,
      type: 'citizen'
    });

    citizenUserId = citizenUser.id;

    // Update user profile to add Telegram nickname
    await userDao.updateUserProfile(citizenUserId, {
      telegram_nickname: telegramNickname
    });
    citizenTelegramUsername = telegramNickname.replace('@', '').toLowerCase();

    // Create a pending report (use valid category)
    const pendingReport = await reportRepository.createReport({
      userId: citizenUserId,
      latitude: 45.0703,
      longitude: 7.6869,
      title: 'Telegram Test Report - Pending',
      description: 'This is a test report for Telegram bot',
      category: 'Roads and Urban Furnishings',
      photos: ['/static/uploads/test1.jpg']
    }, false);

    reportId = pendingReport.id;

    // Create a rejected report (use valid category)
    const rejectedReport = await reportRepository.createReport({
      userId: citizenUserId,
      latitude: 45.0710,
      longitude: 7.6870,
      title: 'Telegram Test Report - Rejected',
      description: 'This report will be rejected',
      category: 'Public Lighting',
      photos: ['/static/uploads/test2.jpg']
    }, false);

    reportIdRejected = rejectedReport.id;

    // Reject the report
    await reportRepository.reviewReport(reportIdRejected, {
      status: 'rejected',
      explanation: 'Duplicate report - already exists'
    });

    // Create an assigned report (use valid category)
    const assignedReport = await reportRepository.createReport({
      userId: citizenUserId,
      latitude: 45.0720,
      longitude: 7.6880,
      title: 'Telegram Test Report - Assigned',
      description: 'This report will be assigned',
      category: 'Architectural Barriers',
      photos: ['/static/uploads/test3.jpg']
    }, false);

    reportIdAssigned = assignedReport.id;

    // Accept/assign the report (requires a technical officer)
    // First create a technical officer
    const techUser = await userDao.createUser({
      username: `tech_officer_${timestamp}`,
      email: `tech_officer_${timestamp}@example.com`,
      name: 'Tech',
      surname: 'Officer',
      password: 'Password123!',
      skipConfirmation: true,
      type: 'municipality_user'
    });
    await userDao.addRoleToUser(techUser.id, 'urban_planner');

    // Accept the report
    await reportRepository.reviewReport(reportIdAssigned, {
      status: 'accepted',
      technicalOffice: 'urban_planner'
    });

    // Spy and mock DAO lookup to return a single user object
    jest.spyOn(userDao, 'getUserByTelegramNickname').mockImplementation(async (nickname) => {
      const normalized = (nickname || '').replace(/^@/, '').toLowerCase();
      if (normalized === citizenTelegramUsername) {
        return {
          id: citizenUserId,
          username,
          telegram_nickname: '@' + citizenTelegramUsername,
          roles: ['citizen']
        };
      }
      return null;
    });
  });

  const simulateTelegramMessage = async (chatId, username, text) => {
    const update = {
      message: {
        message_id: Math.floor(Math.random() * 1000000),
        from: {
          id: chatId,
          username: username,
          first_name: 'Test',
          is_bot: false
        },
        chat: {
          id: chatId,
          type: 'private'
        },
        date: Math.floor(Date.now() / 1000),
        text: text
      }
    };

    telegramBotService.processWebhookUpdate(update);
    // Also invoke handler directly in case processUpdate is a noop
    if (reportStatusHandler) {
      const match = text.match(/\/reportstatus(?:\s+(.+))?/);
      await reportStatusHandler(update.message, match);
    }
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 200));
  };

  test('Citizen can check report status via Telegram bot - Pending report', async () => {
    const telegramUsername = `telegram_user_${Date.now() - 1000}`; // Use approximate timestamp
    const chatId = 123456789;

    // Get the actual telegram nickname from the user
    const user = await userDao.getUserById(citizenUserId);
    const actualTelegramNickname = user.telegram_nickname.replace('@', '');

    await simulateTelegramMessage(chatId, actualTelegramNickname, `/reportstatus ${reportId}`);

    // Check that sendMessage was called
    expect(mockBotInstance.sendMessage).toHaveBeenCalled();
    
    // Find the message sent to our chat
    const statusMessage = sentMessages.find(msg => msg.chatId === chatId);
    expect(statusMessage).toBeDefined();
    expect(statusMessage.text).toContain(`Report Details #${reportId}`);
    expect(statusMessage.text).toContain('Telegram Test Report - Pending');
    expect(statusMessage.text).toContain('Status:');
    expect(statusMessage.text).toContain('Pending');
  });

  test('Citizen can check report status via Telegram bot - Rejected report with reason', async () => {
    const user = await userDao.getUserById(citizenUserId);
    const actualTelegramNickname = user.telegram_nickname.replace('@', '');
    const chatId = 123456790;

    await simulateTelegramMessage(chatId, actualTelegramNickname, `/reportstatus ${reportIdRejected}`);

    await new Promise(resolve => setTimeout(resolve, 200));

    const statusMessage = sentMessages.find(msg => msg.chatId === chatId);
    expect(statusMessage).toBeDefined();
    expect(statusMessage.text).toContain(`Report Details #${reportIdRejected}`);
    expect(statusMessage.text).toContain('Rejected');
    expect(statusMessage.text).toContain('Reason for Rejection');
    expect(statusMessage.text).toContain('Duplicate report - already exists');
  });

  test('Citizen can check report status via Telegram bot - Assigned report', async () => {
    const user = await userDao.getUserById(citizenUserId);
    const actualTelegramNickname = user.telegram_nickname.replace('@', '');
    const chatId = 123456791;

    await simulateTelegramMessage(chatId, actualTelegramNickname, `/reportstatus ${reportIdAssigned}`);

    await new Promise(resolve => setTimeout(resolve, 200));

    const statusMessage = sentMessages.find(msg => msg.chatId === chatId);
    expect(statusMessage).toBeDefined();
    expect(statusMessage.text).toContain(`Report Details #${reportIdAssigned}`);
    expect(statusMessage.text).toContain('Assigned');
    expect(statusMessage.text).toContain('Assigned Office');
  });

  test('Telegram bot returns error when report ID is invalid', async () => {
    const user = await userDao.getUserById(citizenUserId);
    const actualTelegramNickname = user.telegram_nickname.replace('@', '');
    const chatId = 123456792;

    await simulateTelegramMessage(chatId, actualTelegramNickname, '/reportstatus abc');

    await new Promise(resolve => setTimeout(resolve, 200));

    const errorMessage = sentMessages.find(msg => msg.chatId === chatId);
    expect(errorMessage).toBeDefined();
    expect(errorMessage.text).toContain('Invalid report ID');
  });

  test('Telegram bot returns error when report does not exist', async () => {
    const user = await userDao.getUserById(citizenUserId);
    const actualTelegramNickname = user.telegram_nickname.replace('@', '');
    const chatId = 123456793;

    await simulateTelegramMessage(chatId, actualTelegramNickname, '/reportstatus 99999');

    await new Promise(resolve => setTimeout(resolve, 200));

    const errorMessage = sentMessages.find(msg => msg.chatId === chatId);
    expect(errorMessage).toBeDefined();
    expect(errorMessage.text).toContain('Report #99999 not found');
  });

  test('Telegram bot returns error when user has no Telegram username', async () => {
    const chatId = 123456794;

    await simulateTelegramMessage(chatId, null, '/reportstatus 123');

    await new Promise(resolve => setTimeout(resolve, 200));

    const errorMessage = sentMessages.find(msg => msg.chatId === chatId);
    expect(errorMessage).toBeDefined();
    expect(errorMessage.text).toContain('Please set a username in your Telegram profile');
  });

  test('Telegram bot returns error when Telegram username is not linked to account', async () => {
    const chatId = 123456795;
    const unlinkedUsername = 'unlinked_user';

    await simulateTelegramMessage(chatId, unlinkedUsername, `/reportstatus ${reportId}`);

    await new Promise(resolve => setTimeout(resolve, 200));

    const errorMessage = sentMessages.find(msg => msg.chatId === chatId);
    expect(errorMessage).toBeDefined();
    expect(errorMessage.text).toContain('not linked to any account');
  });

  test('Citizen cannot check another user\'s report status via Telegram', async () => {
    // Create another user with Telegram nickname
    const timestamp = Date.now();
    const otherUsername = `other_user_${timestamp}`;
    const otherTelegramNickname = `@other_user_${timestamp}`;

    const otherUser = await userDao.createUser({
      username: otherUsername,
      email: `${otherUsername}@example.com`,
      name: 'Other',
      surname: 'User',
      password: 'Password123!',
      skipConfirmation: true,
      type: 'citizen'
    });

    await userDao.updateUserProfile(otherUser.id, {
      telegram_nickname: otherTelegramNickname
    });

    // Create a report for the other user
    const otherReport = await reportRepository.createReport({
      userId: otherUser.id,
      latitude: 45.0730,
      longitude: 7.6890,
      title: 'Other User Report',
      description: 'This belongs to another user',
      category: 'Roads and Urban Furnishings',
      photos: ['/static/uploads/other.jpg']
    }, false);

    const chatId = 123456796;
    const user = await userDao.getUserById(citizenUserId);
    const actualTelegramNickname = user.telegram_nickname.replace('@', '');

    // Try to access the other user's report
    await simulateTelegramMessage(chatId, actualTelegramNickname, `/reportstatus ${otherReport.id}`);

    await new Promise(resolve => setTimeout(resolve, 200));

    const errorMessage = sentMessages.find(msg => msg.chatId === chatId);
    expect(errorMessage).toBeDefined();
    expect(errorMessage.text).toContain('not authorized to view report');
  });

  test('Telegram bot displays all report details correctly', async () => {
    const user = await userDao.getUserById(citizenUserId);
    const actualTelegramNickname = user.telegram_nickname.replace('@', '');
    const chatId = 123456797;

    await simulateTelegramMessage(chatId, actualTelegramNickname, `/reportstatus ${reportId}`);

    await new Promise(resolve => setTimeout(resolve, 200));

    const statusMessage = sentMessages.find(msg => msg.chatId === chatId);
    expect(statusMessage).toBeDefined();
    const messageText = statusMessage.text;

    // Verify all expected fields are present
    expect(messageText).toContain('Report Details');
    expect(messageText).toContain('Title:');
    expect(messageText).toContain('Description:');
    expect(messageText).toContain('Category:');
    expect(messageText).toContain('Location:');
    expect(messageText).toContain('Photos:');
    expect(messageText).toContain('Anonymous:');
    expect(messageText).toContain('Status:');
    expect(messageText).toContain('Created:');
    expect(messageText).toContain('Last Updated:');
    expect(messageText).toContain('Use /myreports to see all your reports');
  });

  test('Telegram bot handles different report statuses correctly', async () => {
    const user = await userDao.getUserById(citizenUserId);
    const actualTelegramNickname = user.telegram_nickname.replace('@', '');

    // Test pending status
    let chatId = 123456798;
    await simulateTelegramMessage(chatId, actualTelegramNickname, `/reportstatus ${reportId}`);
    await new Promise(resolve => setTimeout(resolve, 200));
    let statusMessage = sentMessages.find(msg => msg.chatId === chatId);
    expect(statusMessage.text).toMatch(/Status:.*Pending/i);

    // Test rejected status
    chatId = 123456799;
    await simulateTelegramMessage(chatId, actualTelegramNickname, `/reportstatus ${reportIdRejected}`);
    await new Promise(resolve => setTimeout(resolve, 200));
    statusMessage = sentMessages.find(msg => msg.chatId === chatId);
    expect(statusMessage.text).toMatch(/Status:.*Rejected/i);

    // Test assigned status
    chatId = 123456800;
    await simulateTelegramMessage(chatId, actualTelegramNickname, `/reportstatus ${reportIdAssigned}`);
    await new Promise(resolve => setTimeout(resolve, 200));
    statusMessage = sentMessages.find(msg => msg.chatId === chatId);
    expect(statusMessage.text).toMatch(/Status:.*Assigned/i);
  });
});

