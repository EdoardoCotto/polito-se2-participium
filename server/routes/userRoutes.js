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

module.exports = router;


