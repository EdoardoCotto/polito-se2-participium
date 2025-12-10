"use strict";

const commentDao = require('../dao/commentDao');
const reportDao = require('../dao/reportDao');
const BadRequestError = require('../errors/BadRequestError');
const NotFoundError = require('../errors/NotFoundError');
const UnauthorizedError = require('../errors/UnauthorizedError');

exports.addComment = async (reportId, authorId, text) => {
  if (!reportId || !Number.isInteger(reportId)) throw new BadRequestError('Invalid Report ID');
  if (!text || typeof text !== 'string' || !text.trim()) throw new BadRequestError('Comment text is required');

  // Verifica esistenza report
  const report = await reportDao.getReportById(reportId);
  if (!report) throw new NotFoundError('Report not found');

  // Per ora assumiamo che se hai accesso alla rotta, puoi commentare per coordinazione.

  const newComment = await commentDao.createComment(reportId, authorId, text.trim());
  return newComment;
};

exports.getComments = async (reportId) => {
  if (!reportId || !Number.isInteger(reportId)) throw new BadRequestError('Invalid Report ID');
  
  // Verifica esistenza report
  const report = await reportDao.getReportById(reportId);
  if (!report) throw new NotFoundError('Report not found');

  return await commentDao.getCommentsByReportId(reportId);
};