"use strict"

const express = require('express');
const router = express.Router();
const reportController = require('../controller/reportController')


/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Reports management
 */

/**
 * @swagger
 * /reports:
 *   post:
 *     summary: Add one new report
 *     tags: [Reports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: 45.062394
 *               longitude:
 *                 type: number
 *                 example: 7.662697
 *     responses:
 *       200:
 *         description: Report inserted correctly
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 latitude:
 *                   type: number
 *                 longitude:
 *                   type: number
 *       400:
 *          description: All fields are required
 *       401:
 *         description: User is not a citizen
 */
router.post('/reports', reportController.createReport)

module.exports = router