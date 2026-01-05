"use strict";

const express = require('express');
const router = express.Router();
const messageController = require('../controller/messageController');
const { isLoggedIn } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /reports/{id}/messages:
 *   post:
 *     summary: Invia un messaggio (Cittadino o Staff)
 *     tags: [Messages]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID della segnalazione
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Buongiorno, ci sono aggiornamenti?"
 *     responses:
 *       201:
 *         description: Messaggio inviato con successo
 *       400:
 *         description: Dati non validi
 *       401:
 *         description: Utente non autenticato
 */
router.post(
  '/reports/:id/messages', 
  isLoggedIn, 
  messageController.createMessage
);

/**
 * @swagger
 * /reports/{id}/messages:
 *   get:
 *     summary: Recupera la chat della segnalazione
 *     tags: [Messages]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID della segnalazione
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista dei messaggi della segnalazione
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   message:
 *                     type: string
 *                   senderType:
 *                     type: string
 *                     example: citizen
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Utente non autenticato
 *       404:
 *         description: Segnalazione non trovata
 */
router.get(
  '/reports/:id/messages', 
  isLoggedIn, 
  messageController.getMessages
);

module.exports = router;