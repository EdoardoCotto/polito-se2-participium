"use strict";

const express = require('express');
const router = express.Router();
const telegramController = require('../controller/telegramController');

/**
 * @swagger
 * /telegram/webhook:
 *   post:
 *     summary: Telegram webhook endpoint
 *     description: Receives updates from Telegram Bot API
 *     tags: [Telegram]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Telegram Update object
 *     responses:
 *       200:
 *         description: Update processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 */
router.post('/telegram/webhook', telegramController.handleWebhook);

/**
 * @swagger
 * /telegram/info:
 *   get:
 *     summary: Get Telegram bot information
 *     description: Returns information about the configured Telegram bot
 *     tags: [Telegram]
 *     responses:
 *       200:
 *         description: Bot information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 bot:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     first_name:
 *                       type: string
 *                     is_bot:
 *                       type: boolean
 *       503:
 *         description: Bot not initialized
 */
router.get('/telegram/info', telegramController.getBotInfo);

module.exports = router;

