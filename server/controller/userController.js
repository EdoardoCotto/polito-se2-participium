'use strict';

const userRepository = require('../repository/userRepository');
const AppError = require('../errors/AppError');
const { ALLOWED_ROLES, ROLE_METADATA } = require('../constants/roles');

/**
 * Get user by id
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await userRepository.getUserById(req.params.id);
    return res.status(200).json(user);
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Authenticate user (login).
 * Expects { username, password } in the request body.
 */
exports.getUser = async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const user = await userRepository.getUser(username, password);
    return res.status(200).json(user);
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Assign a role/type to a user (admin only).
 * Validates path param and presence of 'type' before delegating to repository.
 */
exports.assignUserRole = async (req, res) => {
  try {
    const targetUserId = Number(req.params.id);
    if (!Number.isInteger(targetUserId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const { type } = req.body || {};
    if (!type) {
      return res.status(400).json({ error: 'Role (type) is required' });
    }

    const updated = await userRepository.assignUserRole(req.user.id, targetUserId, type);
    return res.status(200).json(updated); // { id, type }
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Return allowed roles (and optional metadata for UI).
 */
exports.getAllowedRoles = async (_req, res) => {
  return res.status(200).json({
    roles: ALLOWED_ROLES,
    metadata: ROLE_METADATA, // remove if you don't need labels on the UI
  });
};

/**
 * Public registration (creates a citizen).
 */
exports.createUser = async (req, res) => {
  try {
    const created = await userRepository.createUser(req.body);
    return res.status(201).json(created);
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Admin creates any user with a specific role.
 */
exports.createUserIfAdmin = async (req, res) => {
  try {
    const created = await userRepository.createUserIfAdmin(req.user.id, req.body);
    return res.status(201).json(created);
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
/**
 * GET /users/municipality - admin only
 * Returns all users whose type is not citizen or admin.
 */
exports.getMunicipalityUsers = async (req, res) => {
  try {
    const users = await userRepository.getMunicipalityUsers(req.user.id);
    return res.status(200).json(users);
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


exports.updateUserProfile = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (req.user.id !== userId){
      return res.status(403).json({ error: 'You can only update your own profile' });
    }
    const updateData = {};
    if (req.file) {
      updateData.personal_photo_path = `/static/avatars/${req.file.filename}`;
    }
    if (req.body.mail_notifications !== undefined) {
      updateData.mail_notifications = req.body.mail_notifications === 'true' || req.body.mail_notifications === true ? 1 : 0;
    }
    if (req.body.telegram_nickname !== undefined && req.body.telegram_nickname.trim() !== '') {
      updateData.telegram_nickname = req.body.telegram_nickname;
    }
    const result = await userRepository.updateUserProfile(userId, updateData);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Error in updateUserProfile:', err);
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}