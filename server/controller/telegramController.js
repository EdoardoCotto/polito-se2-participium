"use strict";

const telegramBotService = require('../services/telegramBotService');

/**
 * Handle Telegram webhook updates
 * POST /api/telegram/webhook
 */
exports.handleWebhook = async (req, res) => {
  try {
    const update = req.body;
    
    // Process the update
    telegramBotService.processWebhookUpdate(update);
    
    // Always return 200 OK to Telegram
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error handling Telegram webhook:', error);
    // Still return 200 to avoid Telegram retrying
    res.status(200).json({ ok: false, error: error.message });
  }
};

/**
 * Get bot info (for testing)
 * GET /api/telegram/info
 */
exports.getBotInfo = async (req, res) => {
  try {
    const bot = telegramBotService.getBot();
    
    if (!bot) {
      return res.status(503).json({ 
        error: 'Telegram bot not initialized',
        message: 'Bot token not configured or bot not started'
      });
    }

    const botInfo = await bot.getMe();
    res.status(200).json({
      ok: true,
      bot: {
        id: botInfo.id,
        username: botInfo.username,
        first_name: botInfo.first_name,
        is_bot: botInfo.is_bot
      }
    });
  } catch (error) {
    console.error('Error getting bot info:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

