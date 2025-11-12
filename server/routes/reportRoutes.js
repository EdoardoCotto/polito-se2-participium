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
 *               title:
 *                 type: string
 *                 example: "Pothole in via Garibaldi"
 *               description:
 *                 type: string
 *                 example: "Large pothole causing danger for cyclists"
 *               category:
 *                 type: string
 *                 enum:
 *                   - Water Supply – Drinking Water
 *                   - Architectural Barriers
 *                   - Sewer System
 *                   - Public Lighting
 *                   - Waste
 *                   - Road Signs and Traffic Lights
 *                   - Roads and Urban Furnishings
 *                   - Public Green Areas and Playgrounds
 *                   - Other
 *               photos:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 3
 *                 items:
 *                   type: string
 *                 example:
 *                   - "/static/uploads/report-123/photo-1.jpg"
 *     responses:
 *       201:
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
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 category:
 *                   type: string
 *                 photos:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *          description: Validation error
 *       401:
 *         description: User is not a citizen
 */
router.post('/reports', reportController.createReport)

module.exports = router