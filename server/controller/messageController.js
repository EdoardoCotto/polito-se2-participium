"use strict";

const messageRepository = require('../repository/messageRepository');
const AppError = require('../errors/AppError');

exports.createMessage = async (req, res) => {
  try {
    const reportId = Number(req.params.id);
    const { message } = req.body;
    const userId = req.user.id;      // Dal middleware isLoggedIn
    const userRole = req.user.role || req.user.type; // Assicurati che il middleware popoli il ruolo

    const result = await messageRepository.addMessage(reportId, userId, message, userRole);
    
    // 201 Created
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const reportId = Number(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role || req.user.type;

    const messages = await messageRepository.getMessages(reportId, userId, userRole);
    res.status(200).json(messages);
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
};