"use strict";

const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User registration and management
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Register a new user (citizen)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, name, surname, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: newcitizen
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newcitizen@example.org
 *               name:
 *                 type: string
 *                 example: Anna
 *               surname:
 *                 type: string
 *                 example: Neri
 *               password:
 *                 type: string
 *                 example: strongPassword123!
 *     responses:
 *       201:
 *         description: User successfully registered
 *       400:
 *         description: Validation error
 *       409:
 *         description: Username already taken
 */
router.post('/users', userController.createUser);

/**
 * @swagger
 * /users/admin:
 *   post:
 *     summary: Create a new user (admin only)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, name, surname, password, type]
 *             properties:
 *               username:
 *                 type: string
 *                 example: newuser
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newuser@example.com
 *               name:
 *                 type: string
 *                 example: Mario
 *               surname:
 *                 type: string
 *                 example: Rossi
 *               password:
 *                 type: string
 *                 example: securePass123!
 *               type:
 *                 type: string
 *                 enum: [citizen, urban_planner]
 *                 example: urban_planner
 *     responses:
 *       201:
 *         description: User successfully created by admin
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated or not admin
 *       409:
 *         description: Username or email already taken
 */
router.post('/users/admin', userController.createUserIfAdmin);

module.exports = router;


