# Telegram Bot Setup Guide (PT12 Backend)

This document explains how to set up and use the Telegram bot for creating reports.

## Overview

The Telegram bot allows citizens to create reports through a guided conversation flow. Users must link their Telegram username in their Participium profile before using the bot.

## Features

- **Guided Report Creation**: Step-by-step process to create reports
- **Location Sharing**: Users can share their location via Telegram
- **Photo Upload**: Support for 1-3 photos per report
- **Anonymous Reports**: Option to create anonymous reports
- **Category Selection**: Choose from predefined report categories

## Setup Instructions

### 1. Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Save the bot token provided by BotFather

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Optional: Webhook URL (if using webhook instead of polling)
# TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook
```

### 3. Webhook vs Polling

The bot supports two modes:

#### Polling Mode (Default)
- Bot polls Telegram servers for updates
- Works for development and testing
- No webhook URL needed
- Set `TELEGRAM_BOT_TOKEN` only

#### Webhook Mode (Production)
- Telegram sends updates to your server
- More efficient for production
- Requires:
  - Public HTTPS URL
  - `TELEGRAM_WEBHOOK_URL` environment variable
  - SSL certificate

### 4. User Setup

Before using the bot, users must:

1. Set a username in their Telegram profile (Settings > Username)
2. Link their Telegram username in their Participium profile:
   - Log in to Participium
   - Go to Profile settings
   - Enter Telegram username (with or without @)
   - Save profile

## API Endpoints

### POST `/api/telegram/webhook`
Receives updates from Telegram Bot API.

**Request Body**: Telegram Update object

**Response**: 
```json
{
  "ok": true
}
```

### GET `/api/telegram/info`
Get information about the configured Telegram bot.

**Response**:
```json
{
  "ok": true,
  "bot": {
    "id": 123456789,
    "username": "your_bot",
    "first_name": "Your Bot",
    "is_bot": true
  }
}
```

## Bot Commands

- `/start` - Welcome message and help
- `/help` - Show available commands
- `/newreport` - Start creating a new report
- `/cancel` - Cancel the current report creation
- `/confirm` - Confirm and create the report (during confirmation step)

## Report Creation Flow

1. **Location** - User shares location via Telegram
2. **Title** - User enters report title
3. **Description** - User enters report description
4. **Category** - User selects from predefined categories
5. **Photos** - User sends 1-3 photos (send `/done` when finished)
6. **Anonymous** - User chooses if report should be anonymous
7. **Confirmation** - User reviews and confirms with `/confirm`

## Technical Details

### Files Created/Modified

1. **`server/services/telegramBotService.js`**
   - Main bot service with conversation state management
   - Handles all Telegram interactions
   - Downloads and saves photos from Telegram

2. **`server/controller/telegramController.js`**
   - Webhook endpoint handler
   - Bot info endpoint

3. **`server/routes/telegramRoutes.js`**
   - Route definitions for Telegram endpoints

4. **`server/dao/userDao.js`**
   - Added `getUserByTelegramNickname()` method

5. **`server/repository/reportRepository.js`**
   - Updated to handle anonymous reports correctly

6. **`server/index.js`**
   - Bot initialization on server start

### Conversation State Management

The bot uses an in-memory Map to track conversation states:
- Key: Telegram chat ID
- Value: State object with current step and collected data

States are cleared after report creation or cancellation.

### Photo Handling

- Photos are downloaded from Telegram API
- Saved to `server/static/uploads/` directory
- Filenames: `telegram-{timestamp}-{random}.jpg`
- Stored paths: `/static/uploads/{filename}`

## Testing

1. Start the server:
   ```bash
   npm run dev
   ```

2. Check bot status:
   ```bash
   curl http://localhost:3001/api/telegram/info
   ```

3. Test in Telegram:
   - Open your bot in Telegram
   - Send `/start`
   - Send `/newreport` and follow the flow

## Troubleshooting

### Bot not responding
- Check if `TELEGRAM_BOT_TOKEN` is set correctly
- Verify bot is initialized (check server logs)
- Check `/api/telegram/info` endpoint

### "Telegram username not linked" error
- User must set Telegram username in profile
- Username must match exactly (case-insensitive, @ optional)

### Photos not saving
- Check `server/static/uploads/` directory exists
- Verify write permissions
- Check server logs for errors

### Webhook not working
- Ensure HTTPS URL is used
- Verify SSL certificate is valid
- Check webhook URL is accessible from internet
- Use Telegram's `setWebhook` API to verify

## Security Considerations

- Bot token should be kept secret (use environment variables)
- Webhook endpoint should validate requests (optional: verify secret token)
- User authentication is verified via database lookup
- Photos are validated and saved securely

## Future Enhancements

- Report status notifications via Telegram
- View user's reports
- Edit/cancel reports
- Multi-language support

