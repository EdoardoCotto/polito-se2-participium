"use strict";

const express = require('express');
const router = express.Router();
const userDao = require('../dao/userDao');

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
router.post('/users', async (req, res) => {
  const { username, email, name, surname, password } = req.body || {};

  if (!username || !email || !name || !surname || !password) {
    return res.status(400).json({ error: 'username, email, name, surname and password are required' });
  }

  try {
    const created = await userDao.createUser({ username, email, name, surname, password, type: 'citizen' });
    return res.status(201).json(created);
  } catch (err) {
    if (err && err.message && err.message.includes('Username or email')) {
      return res.status(409).json({ error: 'Username or email already taken' });
    }
    return res.status(500).json({ error: 'Failed to register user' });
  }
});

module.exports = router;


