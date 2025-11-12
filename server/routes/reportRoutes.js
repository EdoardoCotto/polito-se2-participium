"use strict"

const express = require('express');
const router = express.Router();
const reportController = require('../controller/reportController')
const uploadMiddleware = require('../middlewares/uploadMiddleware.js');
const { isLoggedIn, isAdmin } = require('../middlewares/authMiddleware');
/**
 * @swagger
 * /reports:
 *   post:
 *     summary: Add one new report (with photos upload)
 *     tags: [Reports]
 *     // Se NON vuoi la security globale, metti qui:
 *     // security:
 *     //   - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [latitude, longitude, title, description, category, photos]
 *             properties:
 *               latitude: { type: number, example: 45.062394 }
 *               longitude: { type: number, example: 7.662697 }
 *               title: { type: string, example: "Pothole in via Garibaldi" }
 *               description: { type: string, example: "Large pothole causing danger for cyclists" }
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
 *                 description: "Attach 1–3 images using the same key 'photos'."
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Report created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

router.post('/reports', isLoggedIn, uploadMiddleware, reportController.createReport);

module.exports = router