// controller/commentController.js
"use strict";

const commentRepository = require('../repository/commentRepository');
const AppError = require('../errors/AppError');

// exports.createComment = async (req, res) => {
//   try {
//     const reportId = Number(req.params.id);
//     const { comment } = req.body;
//     const authorId = req.user.id; // Dal middleware di auth

//     const result = await commentRepository.addComment(reportId, authorId, comment);
//     res.status(201).json(result);
//   } catch (err) {
//     if (err instanceof AppError) return res.status(err.statusCode).json({ error: err.message });
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

exports.getComments = async (req, res) => {
  try {
    const reportId = Number(req.params.id);
    const comments = await commentRepository.getComments(reportId);
    res.status(200).json(comments);
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ error: err.message });
    res.status(500).json({ error: 'Internal Server Error' });
  }
};