"use strict"

const express = require('express');
const router = express.Router();
const categories = require('../constants/reportCategories')

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get report categories
 *     description: Retrieves the list of available report categories
 *     tags:
 *       - Constants
 *     responses:
 *       200:
 *         description: List of report categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["Water Supply – Drinking Water", "Architectural Barriers", "Sewer System"]
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Internal server error"
 */
router.get('/categories', (req, res) => {
  res.json(categories.REPORT_CATEGORIES);
});

module.exports = router;