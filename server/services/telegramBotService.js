"use strict";

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('node:fs');
const path = require('node:path');
const userDao = require('../dao/userDao');
const reportRepository = require('../repository/reportRepository');
const { REPORT_CATEGORIES } = require('../constants/reportCategories');

// Conversation states
const CONVERSATION_STATES = {
  IDLE: 'idle',
  WAITING_LOCATION: 'waiting_location',
  WAITING_TITLE: 'waiting_title',
  WAITING_DESCRIPTION: 'waiting_description',
  WAITING_CATEGORY: 'waiting_category',
  WAITING_PHOTOS: 'waiting_photos',
  WAITING_ANONYMOUS: 'waiting_anonymous',
  CONFIRMING: 'confirming'
};

// Store conversation states: chatId -> state data
const conversationStates = new Map();

// Initialize bot (token will come from environment variable)
let bot = null;

/**
 * Initialize the Telegram bot
 * @param {string} token - Telegram bot token
 * @param {string} webhookUrl - Webhook URL for receiving updates
 */
function initializeBot(token, webhookUrl = null) {
  if (!token) {
    console.warn('⚠️ Telegram bot token not provided. Telegram bot features will be disabled.');
    return null;
  }

  bot = new TelegramBot(token, { polling: !webhookUrl });

  // If webhook URL is provided, set webhook instead of polling
  if (webhookUrl) {
    bot.setWebHook(webhookUrl);
    console.log(`✅ Telegram webhook set to: ${webhookUrl}`);
  }

  // Register bot commands with Telegram (so they appear in the menu)
  registerBotCommands();

  setupCommandHandlers();
  return bot;
}

/**
 * Register bot commands with Telegram (so they appear in the menu)
 */
async function registerBotCommands() {
  if (!bot) return;

  const commands = [
    { command: 'start', description: 'Welcome message and help' },
    { command: 'help', description: 'Show available commands' },
    { command: 'newreport', description: 'Create a new report' },
    { command: 'myreports', description: 'List all your submitted reports' },
    { command: 'reportstatus', description: 'Show details of a specific report (usage: /reportstatus <id>)' },
    { command: 'cancel', description: 'Cancel the current report creation' }
  ];

  try {
    await bot.setMyCommands(commands);
    console.log('✅ Telegram bot commands registered');
  } catch (error) {
    console.error('⚠️ Failed to register bot commands:', error.message);
    console.log('💡 You can manually register commands with BotFather using /setcommands');
  }
}

/**
 * Setup command handlers
 */
function setupCommandHandlers() {
  if (!bot) return;

  // Handle /start command
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username;

    await bot.sendMessage(chatId, 
      `👋 Welcome to Participium!\n\n` +
      `I can help you create reports about issues in your area.\n\n` +
      `Available commands:\n` +
      `/newreport - Create a new report\n` +
      `/myreports - List all your reports\n` +
      `/reportstatus <id> - Check a report's status\n` +
      `/help - Show this help message`
    );
  });

  // Handle /help command
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId,
      `📋 Available Commands:\n\n` +
      `/newreport - Start creating a new report\n` +
      `/myreports - List all your submitted reports\n` +
      `/reportstatus <id> - Show details of a specific report\n` +
      `/cancel - Cancel the current report creation\n\n` +
      `The bot will guide you through:\n` +
      `1. 📍 Location selection\n` +
      `2. 📝 Title and description\n` +
      `3. 🏷️ Category selection\n` +
      `4. 📸 Photo upload (1-3 photos)\n` +
      `5. 👤 Anonymous option`
    );
  });

  // Handle /newreport command
  bot.onText(/\/newreport/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramUsername = msg.from.username;

    if (!telegramUsername) {
      await bot.sendMessage(chatId,
        `❌ Please set a username in your Telegram profile to use this bot.\n\n` +
        `Go to Settings > Username to set one.`
      );
      return;
    }

    // Check if user exists in database
    try {
      const user = await userDao.getUserByTelegramNickname(telegramUsername);
      
      if (!user) {
        await bot.sendMessage(chatId,
          `❌ Your Telegram username (@${telegramUsername}) is not linked to any account.\n\n` +
          `Please link your Telegram username in your Participium profile first.`
        );
        return;
      }

      // Initialize conversation state
      conversationStates.set(chatId, {
        state: CONVERSATION_STATES.WAITING_LOCATION,
        userId: user.id,
        data: {
          photos: []
        }
      });

      await bot.sendMessage(chatId,
        `📋 Let's create a new report!\n\n` +
        `📍 Step 1/6: Please select a location on the Turin map.\n\n` +
        `You can choose any location in Turin:\n\n` +
        `1️⃣ Use the 📍 button below to share your current location\n` +
        `   (if you're at the issue location)\n\n` +
        `2️⃣ Tap the 📎 (attachment) button → Location → Choose on map\n` +
        `   (to select any location on the Turin map)\n\n` +
        `3️⃣ Send coordinates manually (format: latitude,longitude)\n` +
        `   Example: 45.0703, 7.6869\n\n` +
        `Type /cancel to cancel.`,
        {
          reply_markup: {
            keyboard: [[{ text: '📍 Share Current Location', request_location: true }]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }
      );
    } catch (error) {
      console.error('Error in /newreport:', error);
      await bot.sendMessage(chatId, '❌ An error occurred. Please try again later.');
    }
  });

  // Handle /cancel command
  bot.onText(/\/cancel/, async (msg) => {
    const chatId = msg.chat.id;
    conversationStates.delete(chatId);
    await bot.sendMessage(chatId, '❌ Report creation cancelled.', {
      reply_markup: { remove_keyboard: true }
    });
  });

  // Handle /myreports command
  bot.onText(/\/myreports/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramUsername = msg.from.username;

    if (!telegramUsername) {
      await bot.sendMessage(chatId,
        `❌ Please set a username in your Telegram profile to use this bot.\n\n` +
        `Go to Settings > Username to set one.`
      );
      return;
    }

    try {
      const user = await userDao.getUserByTelegramNickname(telegramUsername);
      
      if (!user) {
        await bot.sendMessage(chatId,
          `❌ Your Telegram username (@${telegramUsername}) is not linked to any account.\n\n` +
          `Please link your Telegram username in your Participium profile first.`
        );
        return;
      }

      const reports = await reportRepository.getUserReports(user.id);

      if (reports.length === 0) {
        await bot.sendMessage(chatId,
          `📋 You haven't submitted any reports yet.\n\n` +
          `Use /newreport to create your first report!`
        );
        return;
      }

      // Format status for display
      const formatStatus = (status) => {
        const statusMap = {
          'pending': '⏳ Pending',
          'assigned': '✅ Assigned',
          'rejected': '❌ Rejected',
          'progress': '🔧 In Progress',
          'suspended': '⏸️ Suspended',
          'resolved': '✅ Resolved'
        };
        return statusMap[status] || status;
      };

      let message = `📋 Your Reports (${reports.length}):\n\n`;
      
      reports.forEach((report, index) => {
        const reportId = report.id || report.reportId || 'N/A';
        const status = formatStatus(report.status);
        const title = report.title || 'Untitled';
        const date = report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A';
        
        message += `${index + 1}. Report #${reportId}\n`;
        message += `   📝 ${title}\n`;
        message += `   ${status}\n`;
        message += `   📅 ${date}\n\n`;
      });

      message += `Use /reportstatus <id> to see details of a specific report.\n`;
      message += `Example: /reportstatus ${reports[0].id || reports[0].reportId || '12345'}`;

      await bot.sendMessage(chatId, message);
    } catch (error) {
      console.error('Error in /myreports:', error);
      await bot.sendMessage(chatId, '❌ An error occurred. Please try again later.');
    }
  });

  // Handle /reportstatus command
  bot.onText(/\/reportstatus(?:\s+(\d+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramUsername = msg.from.username;
    const reportId = match && match[1] ? parseInt(match[1], 10) : null;

    if (!telegramUsername) {
      await bot.sendMessage(chatId,
        `❌ Please set a username in your Telegram profile to use this bot.\n\n` +
        `Go to Settings > Username to set one.`
      );
      return;
    }

    if (!reportId || isNaN(reportId)) {
      await bot.sendMessage(chatId,
        `❌ Please provide a valid report ID.\n\n` +
        `Usage: /reportstatus <id>\n` +
        `Example: /reportstatus 12345\n\n` +
        `Use /myreports to see your report IDs.`
      );
      return;
    }

    try {
      const user = await userDao.getUserByTelegramNickname(telegramUsername);
      
      if (!user) {
        await bot.sendMessage(chatId,
          `❌ Your Telegram username (@${telegramUsername}) is not linked to any account.\n\n` +
          `Please link your Telegram username in your Participium profile first.`
        );
        return;
      }

      // Get the report
      const report = await reportRepository.getReportById(reportId);

      // Check if the report belongs to the user (or is anonymous)
      if (report.userId !== user.id) {
        await bot.sendMessage(chatId,
          `❌ You can only view your own reports.\n\n` +
          `This report doesn't belong to your account.`
        );
        return;
      }

      // Format status for display
      const formatStatus = (status) => {
        const statusMap = {
          'pending': '⏳ Pending',
          'assigned': '✅ Assigned',
          'rejected': '❌ Rejected',
          'progress': '🔧 In Progress',
          'suspended': '⏸️ Suspended',
          'resolved': '✅ Resolved'
        };
        return statusMap[status] || status;
      };

      const status = formatStatus(report.status);
      const createdDate = report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A';
      const updatedDate = report.updated_at ? new Date(report.updated_at).toLocaleString() : 'N/A';

      let message = `📋 Report #${reportId}\n\n`;
      message += `📝 Title: ${report.title || 'N/A'}\n`;
      message += `📄 Description: ${report.description || 'N/A'}\n`;
      message += `🏷️ Category: ${report.category || 'N/A'}\n`;
      message += `${status}\n\n`;
      message += `📍 Location: ${report.latitude?.toFixed(6) || 'N/A'}, ${report.longitude?.toFixed(6) || 'N/A'}\n`;
      message += `📅 Created: ${createdDate}\n`;
      message += `🔄 Updated: ${updatedDate}\n`;

      if (report.status === 'rejected' && report.rejection_reason) {
        message += `\n❌ Rejection Reason: ${report.rejection_reason}\n`;
      }

      if (report.technical_office) {
        message += `\n🏢 Technical Office: ${report.technical_office}\n`;
      }

      if (report.photos && report.photos.length > 0) {
        message += `\n📸 Photos: ${report.photos.length}\n`;
      }

      await bot.sendMessage(chatId, message);
    } catch (error) {
      console.error('Error in /reportstatus:', error);
      
      if (error.name === 'NotFoundError') {
        await bot.sendMessage(chatId,
          `❌ Report #${reportId} not found.\n\n` +
          `Use /myreports to see your reports.`
        );
      } else {
        await bot.sendMessage(chatId, '❌ An error occurred. Please try again later.');
      }
    }
  });

  // Handle location messages
  bot.on('location', async (msg) => {
    const chatId = msg.chat.id;
    const state = conversationStates.get(chatId);

    if (!state || state.state !== CONVERSATION_STATES.WAITING_LOCATION) {
      return;
    }

    const location = msg.location;
    
    // Validate coordinates are within reasonable bounds (Turin area)
    const lat = location.latitude;
    const lng = location.longitude;
    
    // Turin approximate bounds: lat 45.0-45.15, lng 7.5-7.8
    if (lat < 44.9 || lat > 45.2 || lng < 7.4 || lng > 7.9) {
      await bot.sendMessage(chatId,
        `⚠️ The location seems to be outside Turin area.\n\n` +
        `Please select a location within Turin city boundaries.\n` +
        `You can share a different location or send coordinates manually.`
      );
      return;
    }
    
    state.data.latitude = lat;
    state.data.longitude = lng;
    state.state = CONVERSATION_STATES.WAITING_TITLE;

    await bot.sendMessage(chatId,
      `✅ Location received!\n\n` +
      `📍 Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}\n\n` +
      `📝 Step 2/6: Please enter a title for your report.\n\n` +
      `Example: "Pothole in via Garibaldi"`,
      { reply_markup: { remove_keyboard: true } }
    );
  });

  // Handle text messages (title, description)
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const state = conversationStates.get(chatId);

    // Skip if message has no text (e.g., photos, locations are handled separately)
    if (!text) {
      return;
    }

    // Skip if no active conversation
    if (!state) {
      // Skip if it's a command (but not /done which is handled in conversation flow)
      if (text && text.startsWith('/')) {
        return;
      }
      return;
    }

    // Allow /done and /confirm commands during conversation, but skip other commands
    if (text && text.startsWith('/')) {
      const allowedCommands = ['/done', '/confirm', '/cancel'];
      const normalizedText = text.toLowerCase().trim();
      if (!allowedCommands.includes(normalizedText)) {
        return;
      }
    }

    try {
      if (state.state === CONVERSATION_STATES.WAITING_LOCATION) {
        // Handle manual coordinate input (format: latitude,longitude or lat,lng)
        const coordPattern = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;
        const match = text.trim().match(coordPattern);
        
        if (match) {
          const lat = parseFloat(match[1]);
          const lng = parseFloat(match[2]);
          
          // Validate coordinates
          if (isNaN(lat) || isNaN(lng)) {
            await bot.sendMessage(chatId, '❌ Invalid coordinates. Please use format: latitude,longitude\nExample: 45.0703, 7.6869');
            return;
          }
          
          // Validate latitude and longitude ranges
          if (lat < -90 || lat > 90) {
            await bot.sendMessage(chatId, '❌ Invalid latitude. Must be between -90 and 90.');
            return;
          }
          
          if (lng < -180 || lng > 180) {
            await bot.sendMessage(chatId, '❌ Invalid longitude. Must be between -180 and 180.');
            return;
          }
          
          // Validate coordinates are within reasonable bounds (Turin area)
          if (lat < 44.9 || lat > 45.2 || lng < 7.4 || lng > 7.9) {
            await bot.sendMessage(chatId,
              `⚠️ The coordinates seem to be outside Turin area.\n\n` +
              `Please select a location within Turin city boundaries.\n` +
              `Turin area: approximately 45.0-45.15, 7.5-7.8`
            );
            return;
          }
          
          state.data.latitude = lat;
          state.data.longitude = lng;
          state.state = CONVERSATION_STATES.WAITING_TITLE;

          await bot.sendMessage(chatId,
            `✅ Location received!\n\n` +
            `📍 Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}\n\n` +
            `📝 Step 2/6: Please enter a title for your report.\n\n` +
            `Example: "Pothole in via Garibaldi"`,
            { reply_markup: { remove_keyboard: true } }
          );
          return;
        } else {
          // Not coordinates, show help
          await bot.sendMessage(chatId,
            `📍 Please select a location on the Turin map.\n\n` +
            `You can choose any location:\n\n` +
            `1️⃣ Use the 📍 button to share your current location\n\n` +
            `2️⃣ Tap 📎 (attachment) → Location → Choose on map\n` +
            `   (to select any location on the Turin map)\n\n` +
            `3️⃣ Send coordinates: latitude,longitude\n` +
            `   Example: 45.0703, 7.6869\n\n` +
            `Type /cancel to cancel.`
          );
          return;
        }
      }
      
      if (state.state === CONVERSATION_STATES.WAITING_TITLE) {
        if (!text || text.trim().length === 0) {
          await bot.sendMessage(chatId, '❌ Please enter a valid title.');
          return;
        }

        state.data.title = text.trim();
        state.state = CONVERSATION_STATES.WAITING_DESCRIPTION;

        await bot.sendMessage(chatId,
          `✅ Title saved!\n\n` +
          `📝 Step 3/6: Please enter a description of the issue.\n\n` +
          `Example: "Large pothole causing danger for cyclists"`
        );
      } else if (state.state === CONVERSATION_STATES.WAITING_DESCRIPTION) {
        if (!text || text.trim().length === 0) {
          await bot.sendMessage(chatId, '❌ Please enter a valid description.');
          return;
        }

        state.data.description = text.trim();
        state.state = CONVERSATION_STATES.WAITING_CATEGORY;

        // Show category keyboard
        const categoryKeyboard = [];
        for (let i = 0; i < REPORT_CATEGORIES.length; i += 2) {
          const row = REPORT_CATEGORIES.slice(i, i + 2).map(cat => ({ text: cat }));
          categoryKeyboard.push(row);
        }

        await bot.sendMessage(chatId,
          `✅ Description saved!\n\n` +
          `🏷️ Step 4/6: Please select a category.`,
          {
            reply_markup: {
              keyboard: categoryKeyboard,
              resize_keyboard: true,
              one_time_keyboard: true
            }
          }
        );
      } else if (state.state === CONVERSATION_STATES.WAITING_CATEGORY) {
        if (!text || !REPORT_CATEGORIES.includes(text)) {
          await bot.sendMessage(chatId,
            `❌ Invalid category. Please select one from the options above.`
          );
          return;
        }

        state.data.category = text;
        state.state = CONVERSATION_STATES.WAITING_PHOTOS;

        await bot.sendMessage(chatId,
          `✅ Category selected!\n\n` +
          `📸 Step 5/6: Please send 1-3 photos of the issue.\n\n` +
          `You can send multiple photos. Send /done when you're finished (minimum 1 photo required).`,
          { reply_markup: { remove_keyboard: true } }
        );
      } else if (state.state === CONVERSATION_STATES.WAITING_PHOTOS) {
        if (text === '/done') {
          if (state.data.photos.length === 0) {
            await bot.sendMessage(chatId, '❌ Please send at least one photo before finishing.');
            return;
          }

          state.state = CONVERSATION_STATES.WAITING_ANONYMOUS;

          await bot.sendMessage(chatId,
            `✅ Photos received!\n\n` +
            `👤 Step 6/6: Do you want this report to be anonymous?\n\n` +
            `Anonymous reports will not show your name publicly.`,
            {
              reply_markup: {
                keyboard: [
                  [{ text: 'Yes, make it anonymous' }, { text: 'No, show my name' }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
              }
            }
          );
        }
      } else if (state.state === CONVERSATION_STATES.WAITING_ANONYMOUS) {
        const isAnonymous = text === 'Yes, make it anonymous';

        state.data.anonymous = isAnonymous;
        state.state = CONVERSATION_STATES.CONFIRMING;

        // Show confirmation
        const summary = 
          `📋 Report Summary:\n\n` +
          `📍 Location: ${state.data.latitude.toFixed(6)}, ${state.data.longitude.toFixed(6)}\n` +
          `📝 Title: ${state.data.title}\n` +
          `📄 Description: ${state.data.description}\n` +
          `🏷️ Category: ${state.data.category}\n` +
          `📸 Photos: ${state.data.photos.length}\n` +
          `👤 Anonymous: ${isAnonymous ? 'Yes' : 'No'}\n\n` +
          `Send /confirm to create the report or /cancel to start over.`;

        await bot.sendMessage(chatId, summary, {
          reply_markup: {
            keyboard: [[{ text: '/confirm' }, { text: '/cancel' }]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        });
      } else if (state.state === CONVERSATION_STATES.CONFIRMING) {
        if (text === '/confirm') {
          await createReportFromTelegram(chatId, state);
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
      await bot.sendMessage(chatId, '❌ An error occurred. Please try again or use /cancel.');
    }
  });

  // Handle photo messages
  bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const state = conversationStates.get(chatId);

    if (!state || state.state !== CONVERSATION_STATES.WAITING_PHOTOS) {
      return;
    }

    if (state.data.photos.length >= 3) {
      await bot.sendMessage(chatId, '❌ Maximum 3 photos allowed. Send /done to continue.');
      return;
    }

    try {
      // Get the largest photo
      const photo = msg.photo[msg.photo.length - 1];
      const fileId = photo.file_id;

      // Get file path from Telegram
      const file = await bot.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

      // Download the photo
      const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);

      // Save to uploads directory
      const uploadsDir = path.join(__dirname, '..', 'static', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `telegram-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, buffer);

      // Store relative path
      state.data.photos.push(`/static/uploads/${fileName}`);
      
      await bot.sendMessage(chatId,
        `✅ Photo ${state.data.photos.length} received! (${state.data.photos.length}/3)\n\n` +
        `Send another photo or /done to continue.`
      );
    } catch (error) {
      console.error('Error downloading photo:', error);
      await bot.sendMessage(chatId, '❌ Error downloading photo. Please try again.');
    }
  });
}

/**
 * Create report from Telegram conversation
 */
async function createReportFromTelegram(chatId, state) {
  try {
    await bot.sendMessage(chatId, '⏳ Creating your report...', {
      reply_markup: { remove_keyboard: true }
    });

    const reportData = {
      userId: state.data.anonymous ? null : state.userId,
      latitude: state.data.latitude,
      longitude: state.data.longitude,
      title: state.data.title,
      description: state.data.description,
      category: state.data.category,
      photos: state.data.photos
    };

    const created = await reportRepository.createReport(reportData, state.data.anonymous);

    // Clear conversation state
    conversationStates.delete(chatId);

    // Extract report ID and status (handle different response formats)
    const reportId = created.id || created.reportId || 'N/A';
    const reportStatus = created.status || 'pending';

    await bot.sendMessage(chatId,
      `✅ Report created successfully!\n\n` +
      `Report ID: #${reportId}\n` +
      `Status: ${reportStatus}\n\n` +
      `Your report has been submitted and will be reviewed by the municipal office.\n\n` +
      `Use /newreport to create another report.`
    );
  } catch (error) {
    console.error('Error creating report:', error);
    conversationStates.delete(chatId);
    await bot.sendMessage(chatId,
      `❌ Failed to create report: ${error.message}\n\n` +
      `Please try again with /newreport.`
    );
  }
}

/**
 * Process webhook update (for webhook mode)
 */
function processWebhookUpdate(update) {
  if (!bot) {
    console.warn('Bot not initialized');
    return;
  }

  bot.processUpdate(update);
}

module.exports = {
  initializeBot,
  processWebhookUpdate,
  getBot: () => bot
};

