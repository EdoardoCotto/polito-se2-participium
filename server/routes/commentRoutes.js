"use strict"

const express = require('express');
const router = express.Router();
const commentController = require('../controller/commentController');
const reportController = require('../controller/reportController')
const uploadMiddleware = require('../middlewares/uploadMiddleware.js');
const { isLoggedIn, isAdmin, isMunicipal_public_relations_officer, isTechnicalOfficeStaff, isExternalMaintainer, isInternalStaffOrMaintainer } = require('../middlewares/authMiddleware');


/**
 * @swagger
 * /comment/{id}/comments:
 *   post:
 *     summary: Add an internal comment to a report
 *     tags: [Comments]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Report identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *                 example: "This issue requires immediate attention"
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       403:
 *         description: Forbidden (Citizens cannot comment)
 *       404:
 *         description: Report not found
 */
router.post(
  '/comment/:id/comments', 
  isLoggedIn, 
  isInternalStaffOrMaintainer, 
  commentController.createComment
);

/**
 * @swagger
 * /comment/{id}/comments:
 *   get:
 *     summary: Get internal comments for a report
 *     tags: [Comments]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report identifier
 *     responses:
 *       200:
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   reportId:
 *                     type: integer
 *                   userId:
 *                     type: integer
 *                   comment:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Report not found
 */
router.get(
  '/comment/:id/comments', 
  isLoggedIn, 
  isInternalStaffOrMaintainer, 
  commentController.getComments
);

module.exports = router;