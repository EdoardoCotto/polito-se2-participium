// Unit tests for Telegram bot service - report status functionality
jest.mock('node-telegram-bot-api');
jest.mock('../../server/dao/userDao');
jest.mock('../../server/repository/reportRepository');

const TelegramBot = require('node-telegram-bot-api');
const userDao = require('../../server/dao/userDao');
const reportRepository = require('../../server/repository/reportRepository');
const telegramBotService = require('../../server/services/telegramBotService');
const NotFoundError = require('../../server/errors/NotFoundError');

describe('Telegram Bot Service - Report Status Command', () => {
  let mockBot;
  let reportStatusHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock bot instance
    mockBot = {
      setMyCommands: jest.fn().mockResolvedValue(true),
      onText: jest.fn((pattern, handler) => {
        // Store the reportstatus handler
        if (pattern.toString().includes('reportstatus')) {
          reportStatusHandler = handler;
        }
      }),
      sendMessage: jest.fn().mockResolvedValue({ message_id: 1 }),
      on: jest.fn(),
      processUpdate: jest.fn(),
      getMe: jest.fn().mockResolvedValue({ id: 123, username: 'test_bot' }),
      token: 'test-token'
    };

    TelegramBot.mockImplementation(() => mockBot);
    
    // Initialize the bot
    telegramBotService.initializeBot('test-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
    reportStatusHandler = null;
  });

  const createMockMessage = (chatId, username, text) => ({
    chat: { id: chatId },
    from: { username: username || 'testuser' },
    text: text,
    message_id: 1
  });

  describe('/reportstatus command - Success cases', () => {
    it('should successfully return report status for valid report ID', async () => {
      expect(reportStatusHandler).toBeDefined();

      const mockUser = { id: 1, username: 'testuser', type: 'citizen' };
      const mockReport = {
        id: 123,
        userId: 1,
        title: 'Test Report',
        description: 'Test Description',
        category: 'Roads',
        latitude: 45.0703,
        longitude: 7.6869,
        status: 'pending',
        photos: ['/static/uploads/photo1.jpg'],
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        rejection_reason: null,
        technical_office: null
      };

      userDao.getUserByTelegramNickname.mockResolvedValue(mockUser);
      reportRepository.getReportById.mockResolvedValue(mockReport);

      const msg = createMockMessage(12345, 'testuser', '/reportstatus 123');
      await reportStatusHandler(msg, ['/reportstatus', '123']);

      expect(userDao.getUserByTelegramNickname).toHaveBeenCalledWith('testuser');
      expect(reportRepository.getReportById).toHaveBeenCalledWith(123);
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        12345,
        expect.stringContaining('Report Details #123')
      );
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        12345,
        expect.stringContaining('Status: ⏳ Pending')
      );
    });

    it('should display correct status emoji for different statuses', async () => {
      const statuses = [
        { status: 'pending', emoji: '⏳' },
        { status: 'assigned', emoji: '✅' },
        { status: 'progress', emoji: '🚧' },
        { status: 'resolved', emoji: '✅' },
        { status: 'suspended', emoji: '⏸️' },
        { status: 'rejected', emoji: '❌' }
      ];

      for (const { status, emoji } of statuses) {
        jest.clearAllMocks();
        const mockUser = { id: 1, username: 'testuser' };
        const mockReport = {
          id: 123,
          userId: 1,
          title: 'Test',
          description: 'Test',
          category: 'Roads',
          latitude: 45.07,
          longitude: 7.68,
          status: status,
          photos: [],
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
          rejection_reason: null,
          technical_office: null
        };

        userDao.getUserByTelegramNickname.mockResolvedValue(mockUser);
        reportRepository.getReportById.mockResolvedValue(mockReport);

        const msg = createMockMessage(12345, 'testuser', `/reportstatus 123`);
        await reportStatusHandler(msg, ['/reportstatus', '123']);

        expect(mockBot.sendMessage).toHaveBeenCalledWith(
          12345,
          expect.stringContaining(emoji)
        );
      }
    });

    it('should include rejection reason when report is rejected', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      const mockReport = {
        id: 123,
        userId: 1,
        title: 'Test Report',
        description: 'Test Description',
        category: 'Roads',
        latitude: 45.07,
        longitude: 7.68,
        status: 'rejected',
        photos: [],
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        rejection_reason: 'Duplicate report',
        technical_office: null
      };

      userDao.getUserByTelegramNickname.mockResolvedValue(mockUser);
      reportRepository.getReportById.mockResolvedValue(mockReport);

      const msg = createMockMessage(12345, 'testuser', '/reportstatus 123');
      await reportStatusHandler(msg, ['/reportstatus', '123']);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        12345,
        expect.stringContaining('Reason for Rejection: Duplicate report')
      );
    });

    it('should include technical office when report is assigned', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      const mockReport = {
        id: 123,
        userId: 1,
        title: 'Test Report',
        description: 'Test Description',
        category: 'Roads',
        latitude: 45.07,
        longitude: 7.68,
        status: 'assigned',
        photos: [],
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        rejection_reason: null,
        technical_office: 'urban_planner'
      };

      userDao.getUserByTelegramNickname.mockResolvedValue(mockUser);
      reportRepository.getReportById.mockResolvedValue(mockReport);

      const msg = createMockMessage(12345, 'testuser', '/reportstatus 123');
      await reportStatusHandler(msg, ['/reportstatus', '123']);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        12345,
        expect.stringContaining('Assigned Office: urban_planner')
      );
    });

    it('should display all report details correctly', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      const mockReport = {
        id: 456,
        userId: 1,
        title: 'Pothole in Via Roma',
        description: 'Large pothole causing danger',
        category: 'Roads',
        latitude: 45.070312,
        longitude: 7.686912,
        status: 'progress',
        photos: ['/static/uploads/photo1.jpg', '/static/uploads/photo2.jpg'],
        created_at: '2024-01-15T10:30:00.000Z',
        updated_at: '2024-01-16T14:20:00.000Z',
        rejection_reason: null,
        technical_office: 'urban_planner'
      };

      userDao.getUserByTelegramNickname.mockResolvedValue(mockUser);
      reportRepository.getReportById.mockResolvedValue(mockReport);

      const msg = createMockMessage(12345, 'testuser', '/reportstatus 456');
      await reportStatusHandler(msg, ['/reportstatus', '456']);

      const sentMessage = mockBot.sendMessage.mock.calls[0][1];
      expect(sentMessage).toContain('Report Details #456');
      expect(sentMessage).toContain('Pothole in Via Roma');
      expect(sentMessage).toContain('Large pothole causing danger');
      expect(sentMessage).toContain('Roads');
      expect(sentMessage).toContain('45.070312, 7.686912');
      expect(sentMessage).toContain('Photos: 2');
      expect(sentMessage).toContain('Anonymous: No');
      expect(sentMessage).toContain('Status: 🚧 Progress');
      expect(sentMessage).toContain('Assigned Office: urban_planner');
    });
  });

  describe('/reportstatus command - Error cases', () => {
    it('should return error when Telegram username is missing', async () => {
      const msg = createMockMessage(12345, null, '/reportstatus 123');
      
      await reportStatusHandler(msg, ['/reportstatus', '123']);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        12345,
        expect.stringContaining('Please set a username in your Telegram profile')
      );
      expect(userDao.getUserByTelegramNickname).not.toHaveBeenCalled();
    });

    it('should return error when report ID is invalid', async () => {
      const msg = createMockMessage(12345, 'testuser', '/reportstatus abc');
      
      await reportStatusHandler(msg, ['/reportstatus', 'abc']);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        12345,
        expect.stringContaining('Invalid report ID')
      );
      expect(userDao.getUserByTelegramNickname).not.toHaveBeenCalled();
    });

    it('should return error when report ID is missing', async () => {
      const msg = createMockMessage(12345, 'testuser', '/reportstatus');
      
      await reportStatusHandler(msg, ['/reportstatus', undefined]);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        12345,
        expect.stringContaining('Invalid report ID')
      );
    });

    it('should return error when user is not linked to Telegram account', async () => {
      userDao.getUserByTelegramNickname.mockResolvedValue(null);

      const msg = createMockMessage(12345, 'testuser', '/reportstatus 123');
      await reportStatusHandler(msg, ['/reportstatus', '123']);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        12345,
        expect.stringContaining('not linked to any account')
      );
      expect(reportRepository.getReportById).not.toHaveBeenCalled();
    });

    it('should return error when report is not found', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      reportRepository.getReportById.mockRejectedValue(
        new NotFoundError('Report not found')
      );

      userDao.getUserByTelegramNickname.mockResolvedValue(mockUser);

      const msg = createMockMessage(12345, 'testuser', '/reportstatus 999');
      await reportStatusHandler(msg, ['/reportstatus', '999']);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        12345,
        expect.stringContaining('Report #999 not found')
      );
    });

    it('should return error when user tries to access another user\'s report', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      const mockReport = {
        id: 123,
        userId: 999, // Different user ID
        title: 'Other User Report',
        description: 'Description',
        category: 'Roads',
        latitude: 45.07,
        longitude: 7.68,
        status: 'pending',
        photos: [],
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        rejection_reason: null,
        technical_office: null
      };

      userDao.getUserByTelegramNickname.mockResolvedValue(mockUser);
      reportRepository.getReportById.mockResolvedValue(mockReport);

      const msg = createMockMessage(12345, 'testuser', '/reportstatus 123');
      await reportStatusHandler(msg, ['/reportstatus', '123']);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        12345,
        expect.stringContaining('not authorized to view report')
      );
    });

    it('should handle database errors gracefully', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      
      userDao.getUserByTelegramNickname.mockResolvedValue(mockUser);
      reportRepository.getReportById.mockRejectedValue(new Error('Database error'));

      const msg = createMockMessage(12345, 'testuser', '/reportstatus 123');
      await reportStatusHandler(msg, ['/reportstatus', '123']);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        12345,
        expect.stringContaining('error occurred while fetching report details')
      );
    });

    it('should handle errors when getting user by Telegram nickname', async () => {
      userDao.getUserByTelegramNickname.mockRejectedValue(new Error('Database error'));

      const msg = createMockMessage(12345, 'testuser', '/reportstatus 123');
      await reportStatusHandler(msg, ['/reportstatus', '123']);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        12345,
        expect.stringContaining('error occurred while fetching report details')
      );
    });
  });

  describe('/reportstatus command - Edge cases', () => {
    it('should handle anonymous reports correctly', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      const mockReport = {
        id: 123,
        userId: null, // Anonymous report
        title: 'Anonymous Report',
        description: 'Description',
        category: 'Roads',
        latitude: 45.07,
        longitude: 7.68,
        status: 'pending',
        photos: [],
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        rejection_reason: null,
        technical_office: null
      };

      userDao.getUserByTelegramNickname.mockResolvedValue(mockUser);
      reportRepository.getReportById.mockResolvedValue(mockReport);

      const msg = createMockMessage(12345, 'testuser', '/reportstatus 123');
      await reportStatusHandler(msg, ['/reportstatus', '123']);

      // Anonymous reports should not be accessible via Telegram (userId mismatch)
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        12345,
        expect.stringContaining('not authorized')
      );
    });

    it('should handle reports with no photos', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      const mockReport = {
        id: 123,
        userId: 1,
        title: 'Test Report',
        description: 'Test Description',
        category: 'Roads',
        latitude: 45.07,
        longitude: 7.68,
        status: 'pending',
        photos: [],
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        rejection_reason: null,
        technical_office: null
      };

      userDao.getUserByTelegramNickname.mockResolvedValue(mockUser);
      reportRepository.getReportById.mockResolvedValue(mockReport);

      const msg = createMockMessage(12345, 'testuser', '/reportstatus 123');
      await reportStatusHandler(msg, ['/reportstatus', '123']);

      const sentMessage = mockBot.sendMessage.mock.calls[0][1];
      expect(sentMessage).toContain('Photos: 0');
    });

    it('should handle numeric report ID as string', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      const mockReport = {
        id: 123,
        userId: 1,
        title: 'Test Report',
        description: 'Test Description',
        category: 'Roads',
        latitude: 45.07,
        longitude: 7.68,
        status: 'pending',
        photos: [],
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        rejection_reason: null,
        technical_office: null
      };

      userDao.getUserByTelegramNickname.mockResolvedValue(mockUser);
      reportRepository.getReportById.mockResolvedValue(mockReport);

      const msg = createMockMessage(12345, 'testuser', '/reportstatus 123');
      await reportStatusHandler(msg, ['/reportstatus', '123']);

      expect(reportRepository.getReportById).toHaveBeenCalledWith(123);
    });
  });
});

