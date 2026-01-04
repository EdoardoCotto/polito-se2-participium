"use strict";

const express = require('express');
const passport = require('../utils/passport');
const router = express.Router();
const sessionController = require('../controller/sessionController');

/**
 * @swagger
 * tags:
 *   name: Sessions
 *   description: User authentication and session management
 */

/**
 * @swagger
 * /sessions:
 *   post:
 *     summary: Login user
 *     tags: [Sessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: citizen1
 *               password:
 *                 type: string
 *                 example: test123
 *     responses:
 *       200:
 *         description: User successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 username:
 *                   type: string
 *                 name:
 *                   type: string
 *                 surname:
 *                   type: string
 *                 type:
 *                   type: string
 *                   enum: [admin, citizen, municipality_user]
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Invalid username or password
 */
router.post('/sessions', sessionController.login);

/**
 * @swagger
 * /sessions/current:
 *   get:
 *     summary: Get current logged-in user
 *     tags: [Sessions]
 *     responses:
 *       200:
 *         description: Current user session
 *       401:
 *         description: Not authenticated
 */
router.get('/sessions/current', sessionController.getCurrentSession);

/**
 * @swagger
 * /sessions/current:
 *   delete:
 *     summary: Logout user
 *     tags: [Sessions]
 *     responses:
 *       200:
 *         description: User logged out successfully
 */
router.delete('/sessions/current', sessionController.logout);

module.exports = router;
