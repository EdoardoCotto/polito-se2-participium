"use strict";

const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const { isLoggedIn } = require('../middlewares/authMiddleware');
const { ALLOWED_ROLES } = require('../constants/roles');

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
router.post('/users/admin', isLoggedIn ,userController.createUserIfAdmin);

/**
 * @swagger
 * /users/{id}/type:
 *   put:
 *     summary: Assign a role to a user (admin only)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [citizen, admin, urban_planner, municipal_public_relations_officer, municipal_administrator, technical_office_staff_member]
 *                 example: municipal_administrator
 *     responses:
 *       200:
 *         description: Role successfully updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated or not admin
 *       404:
 *         description: User not found
 */
router.put('/users/:id/type', isLoggedIn, userController.assignUserRole);

/**
 * @swagger
 * /users/roles:
 *   get:
 *     summary: Get allowed roles
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of allowed roles
 */
router.get('/users/roles', (_req, res) => res.status(200).json({ roles: ALLOWED_ROLES }));

module.exports = router;


