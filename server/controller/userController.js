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
    
    // Gestione della foto profilo basata su photo_action
    if (req.body.photo_action === 'upload' && req.file) {
      // Nuovo file caricato
      updateData.personal_photo_path = `/static/avatars/${req.file.filename}`;
    } else if (req.body.photo_action === 'remove') {
      // Richiesta esplicita di rimozione
      updateData.personal_photo_path = null;
    }
    // Se photo_action non è presente o ha altro valore, mantieni il valore esistente
    
    if (req.body.mail_notifications !== undefined) {
      updateData.mail_notifications = req.body.mail_notifications === 'true' || req.body.mail_notifications === true ? 1 : 0;
    }
    
    if (req.body.telegram_nickname !== undefined) {
      updateData.telegram_nickname = req.body.telegram_nickname.trim() === '' ? null : req.body.telegram_nickname;
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

/**
 * Get all external maintainers
 * Available to technical office staff members
 */
exports.getExternalMaintainers = async (req, res) => {
  try {
    const maintainers = await userRepository.getExternalMaintainers();
    return res.status(200).json(maintainers);
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Confirm user registration with confirmation code
 */
exports.confirmRegistration = async (req, res) => {
  try {
    const { email, code } = req.body || {};
    
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and confirmation code are required' });
    }
    
    await userRepository.confirmUser(email, code);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Account successfully confirmed. You can now log in.' 
    });
  } catch (err) {
    console.error('Error in confirmRegistration:', err);
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Resend confirmation code
 */
exports.resendConfirmationCode = async (req, res) => {
  try {
    const { email } = req.body || {};
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const result = await userRepository.resendConfirmationCode(email);
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.deleteRoleFromUser = async (req, res) => {
  try {
    await userRepository.deleteRoleFromUser(req.user.id, req.params.id, req.body.role);
    return res.status(200).json({ message: 'Role deleted successfully' });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.addRoleToUser = async (req, res) => {
  try {
    const updatedUser = await userRepository.addRoleToUser(req.user.id, req.params.id, req.body.role);
    return res.status(200).json(updatedUser);
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};