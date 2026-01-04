"use strict";

const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const { isLoggedIn, isAdmin, isTechnicalOfficeStaff } = require('../middlewares/authMiddleware');
const { updateProfile } = require('../middlewares/uploadMiddleware')

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
 *     description: Register a new citizen account. A confirmation code will be sent to the provided email address. The account must be confirmed within 30 minutes.
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
 *       201: 
 *         description: User successfully registered. Confirmation code sent to email.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer }
 *                 username: { type: string }
 *                 email: { type: string }
 *                 name: { type: string }
 *                 surname: { type: string }
 *                 type: { type: string }
 *       400: { description: Validation error }
 *       409: { description: Username or email already taken }
 */
router.post('/users', userController.createUser);

/**
 * @swagger
 * /users/confirm:
 *   post:
 *     summary: Confirm user registration with code
 *     tags: [Users]
 *     description: Confirm a citizen account using the confirmation code sent via email. The code is valid for 30 minutes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email: 
 *                 type: string
 *                 format: email
 *                 example: newcitizen@example.org
 *               code: 
 *                 type: string
 *                 example: "123456"
 *                 description: 6-digit confirmation code
 *     responses:
 *       200: 
 *         description: Account successfully confirmed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Account successfully confirmed. You can now log in." }
 *       400: 
 *         description: Invalid or expired confirmation code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string }
 *       404: 
 *         description: User not found
 */
router.post('/users/confirm', userController.confirmRegistration);

/**
 * @swagger
 * /users/resend-confirmation:
 *   post:
 *     summary: Resend confirmation code
 *     tags: [Users]
 *     description: Request a new confirmation code if the previous one expired or was lost. A new code will be sent to the email address.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: 
 *                 type: string
 *                 format: email
 *                 example: newcitizen@example.org
 *     responses:
 *       200: 
 *         description: New confirmation code sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Confirmation code sent to your email" }
 *       400: 
 *         description: User already confirmed or invalid request
 *       404: 
 *         description: User not found
 */
router.post('/users/resend-confirmation', userController.resendConfirmationCode);

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
 *               personal_photo:
 *                 type: File
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
 *       403:
 *          description: Forbidden
 *       404:
 *         description: User not found
 */
router.put('/users/:id/update', isLoggedIn, updateProfile, userController.updateUserProfile);

/**
 * @swagger
 * /users/external-maintainers:
 *   get:
 *     summary: Get all external maintainers
 *     description: Returns a list of all external maintainers. Available to technical office staff members.
 *     tags: [Users]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: List of external maintainers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 5
 *                   username:
 *                     type: string
 *                     example: "enel_maintainer"
 *                   email:
 *                     type: string
 *                     example: "maintainer@enel.com"
 *                   name:
 *                     type: string
 *                     example: "Mario"
 *                   surname:
 *                     type: string
 *                     example: "Rossi"
 *                   type:
 *                     type: string
 *                     example: "external_maintainer"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden (user is not a technical office staff member)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/users/external-maintainers', isLoggedIn, isTechnicalOfficeStaff, userController.getExternalMaintainers);

/**
 * @swagger
 * /users/{id}/assign-role:
 *   post:
 *     summary: Assign a role to a municipality user (admin only)
 *     tags: [Users]
 *     security: [ { cookieAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: 
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum:
 *                   [municipal_public_relations_officer, municipal_administrator,
 *                    urban_planner, building_permit_officer, building_inspector, suap_officer,
 *                    public_works_engineer, mobility_traffic_engineer, environment_technician,
 *                    technical_office_staff_member, external_maintainer]
 *                 example: urban_planner
 *                 description: Role to assign to the municipality user
 *     responses:
 *       200: 
 *         description: Role successfully assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 username:
 *                   type: string
 *                 type:
 *                   type: string
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: string
 *       400: { description: Invalid role or validation error }
 *       401: { description: Not authenticated }
 *       403: { description: Not admin or user is not municipality_user }
 *       404: { description: User not found }
 */
router.post('/users/:id/assign-role', isLoggedIn, isAdmin, userController.addRoleToUser);

/**
 * @swagger
 * /users/{id}/remove-role:
 *   delete:
 *     summary: Remove a role from a municipality user (admin only)
 *     tags: [Users]
 *     security: [ { cookieAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: 
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum:
 *                   [municipal_public_relations_officer, municipal_administrator,
 *                    urban_planner, building_permit_officer, building_inspector, suap_officer,
 *                    public_works_engineer, mobility_traffic_engineer, environment_technician,
 *                    technical_office_staff_member, external_maintainer]
 *                 example: urban_planner
 *                 description: Role to remove from the municipality user
 *     responses:
 *       200: 
 *         description: Role successfully removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Role deleted successfully
 *       400: { description: Invalid role or validation error }
 *       401: { description: Not authenticated }
 *       403: { description: Not admin or user is not municipality_user }
 *       404: { description: User or role not found }
 */
router.delete('/users/:id/remove-role', isLoggedIn, isAdmin, userController.deleteRoleFromUser);

module.exports = router;
