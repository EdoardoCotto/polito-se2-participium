"use strict";

const messageDao = require('../dao/messageDao');
const reportDao = require('../dao/reportDao'); 
const BadRequestError = require('../errors/BadRequestError');
const NotFoundError = require('../errors/NotFoundError');
const UnauthorizedError = require('../errors/UnauthorizedError');

exports.addMessage = async (reportId, userId, text, userRole) => {
  if (!reportId || !Number.isInteger(reportId)) throw new BadRequestError('ID Segnalazione non valido');
  if (!text || typeof text !== 'string' || !text.trim()) throw new BadRequestError('Il testo del messaggio è obbligatorio');

  // 1. Recupera la segnalazione per verificare permessi
  const report = await reportDao.getReportById(reportId);
  if (!report) throw new NotFoundError('Segnalazione non trovata');

  // 2. LOGICA DI AUTORIZZAZIONE
  // Chi può scrivere? 
  // A. Il Cittadino che ha creato la segnalazione
  // B. L'Operatore (Officer) assegnato
  // C. Il Maintainer esterno assegnato
  
  const isOwner = report.userId === userId;
  const isAssignedOfficer = report.officerId === userId;
  const isAssignedMaintainer = report.external_maintainerId === userId;
  
  // Se l'utente è un admin o staff tecnico generico, potremmo volerlo lasciar scrivere comunque.
  // Qui sotto assumo che SOLO le persone coinvolte possano scrivere.
  const isAuthorizedStaff = userRole === 'admin';

  if (!isOwner && !isAssignedOfficer && !isAssignedMaintainer && !isAuthorizedStaff) {
    throw new UnauthorizedError('Non sei autorizzato a inviare messaggi su questa segnalazione');
  }

  // 3. Salvataggio
  const newMessage = await messageDao.createMessage(reportId, userId, text.trim());
  return newMessage;
};

exports.getMessages = async (reportId, userId, userRole) => {
  if (!reportId || !Number.isInteger(reportId)) throw new BadRequestError('ID Segnalazione non valido');
  
  const report = await reportDao.getReportById(reportId);
  if (!report) throw new NotFoundError('Segnalazione non trovata');

  // Logica di lettura: simile alla scrittura. 
  // Se sei un cittadino, devi essere il proprietario.
  if (userRole === 'citizen' && report.userId !== userId) {
     throw new UnauthorizedError('Non puoi leggere i messaggi di una segnalazione non tua');
  }

  return await messageDao.getMessagesByReportId(reportId);
};