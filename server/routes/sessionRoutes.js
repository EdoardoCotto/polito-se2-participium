"use strict";

const express = require('express');
const passport = require('../utils/passport');
const router = express.Router();

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
 *       401:
 *         description: Invalid username or password
 */
router.post('/sessions', function (req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user)
      return res.status(401).json({ message: info?.message || 'Incorrect username or password' });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(200).json({
        id: user.id,
        username: user.username,
        name: user.name,
        surname: user.surname,
        type: user.type,
      });
    });
  })(req, res, next);
});

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
router.get('/sessions/current', (req, res) => {
  if (req.isAuthenticated())
    res.status(200).json(req.user);
  else
    res.status(401).json({ error: 'Not authenticated' });
});

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
router.delete('/sessions/current', (req, res) => {
  req.logout((err) => {
    if (err)
      return res.status(500).json({ error: 'Logout failed' });
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

module.exports = router;
