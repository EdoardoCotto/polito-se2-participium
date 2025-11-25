"use strict";

const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const { isLoggedIn, isAdmin } = require('../middlewares/authMiddleware');

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
 *               username: { type: string, example: newcitizen }
 *               email: { type: string, format: email, example: newcitizen@example.org }
 *               name: { type: string, example: Anna }
 *               surname: { type: string, example: Neri }
 *               password: { type: string, example: strongPassword123! }
 *     responses:
 *       201: { description: User successfully registered }
 *       400: { description: Validation error }
 *       409: { description: Username already taken }
 */
router.post('/users', userController.createUser);

/**
 * @swagger
 * /users/admin:
 *   post:
 *     summary: Create a new user (admin only)
 *     tags: [Users]
 *     security: [ { cookieAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, name, surname, password, type]
 *             properties:
 *               username: { type: string, example: newuser }
 *               email: { type: string, format: email, example: newuser@example.com }
 *               name: { type: string, example: Mario }
 *               surname: { type: string, example: Rossi }
 *               password: { type: string, example: securePass123! }
 *               type:
 *                 type: string
 *                 enum:
 *                   [citizen, admin, municipal_public_relations_officer, municipal_administrator,
 *                    urban_planner, building_permit_officer, building_inspector, suap_officer,
 *                    public_works_engineer, mobility_traffic_engineer, environment_technician,
 *                    technical_office_staff_member]
 *                 example: urban_planner
 *     responses:
 *       201: { description: User successfully created by admin }
 *       400: { description: Validation error }
 *       401: { description: Not authenticated }
 *       403: { description: Not admin }
 *       409: { description: Username or email already taken }
 */
router.post('/users/admin', isLoggedIn, isAdmin, userController.createUserIfAdmin);

/**
 * @swagger
 * /users/{id}/type:
 *   put:
 *     summary: Assign a role/type to a user (admin only)
 *     tags: [Users]
 *     security: [ { cookieAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
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
 *                 enum:
 *                   [citizen, admin, municipal_public_relations_officer, municipal_administrator,
 *                    urban_planner, building_permit_officer, building_inspector, suap_officer,
 *                    public_works_engineer, mobility_traffic_engineer, environment_technician,
 *                    technical_office_staff_member]
 *     responses:
 *       200: { description: Role updated }
 *       400: { description: Invalid role }
 *       401: { description: Not authenticated }
 *       403: { description: Not admin }
 *       404: { description: User not found }
 */
router.put('/users/:id/type', isLoggedIn, isAdmin, userController.assignUserRole);

/**
 * @swagger
 * /users/roles:
 *   get:
 *     summary: Get allowed roles (admin only)
 *     tags: [Users]
 *     security: [ { cookieAuth: [] } ]
 *     responses:
 *       200: { description: Allowed roles }
 */
router.get('/users/roles', isLoggedIn, isAdmin, userController.getAllowedRoles);

/**
 * @swagger
 * /users/municipality:
 *   get:
 *     summary: List all municipality users (non-citizen, non-admin)
 *     tags: [Users]
 *     security: [ { cookieAuth: [] } ]
 *     responses:
 *       200:
 *         description: List of municipality users
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not admin
 */
router.get('/users/municipality', isLoggedIn, isAdmin, userController.getMunicipalityUsers);

/**
 * @swagger
 * /users/{id}/update:
 *   put:
 *     summary: Update user profile information
 *     tags: [Users]
 *     security: [ { cookieAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               telegram_nickname:
 *                 type: string
 *                 example: "@myTelegramHandle"
 *                 description: Telegram nickname
 *               personal_photo_path:
 *                 type: string
 *                 example: "/uploads/photos/user123.jpg"
 *                 description: Path to user's personal photo
 *               mail_notifications:
 *                 type: boolean
 *                 example: true
 *                 description: Enable/disable email notifications
 *     responses:
 *       200:
 *         description: User profile successfully updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 */
router.put('/users/:id/update', userController.addTelegramNickname, userController.addPersonalPhotoPath, userController.updateMailNotifications);

module.exports = router;
