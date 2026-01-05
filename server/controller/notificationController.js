'use strict';

const notificationService = require('../services/notificationService');
const AppError = require('../errors/AppError');

/**
 * Get all notifications for the logged-in user
 */
exports.getNotifications = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const notifications = await notificationService.getUserNotifications(req.user.id);
    return res.status(200).json(notifications);
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('Error in getNotifications controller:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Get unread notifications for the logged-in user
 */
exports.getUnreadNotifications = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const notifications = await notificationService.getUnreadNotifications(req.user.id);
    return res.status(200).json(notifications);
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('Error in getUnreadNotifications controller:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Mark a notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const notificationId = Number(req.params.id);
    if (!Number.isInteger(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification id' });
    }

    const notification = await notificationService.markAsRead(notificationId, req.user.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.status(200).json(notification);
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('Error in markAsRead controller:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Mark all notifications as read for the logged-in user
 */
exports.markAllAsRead = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const count = await notificationService.markAllAsRead(req.user.id);
    return res.status(200).json({ 
      message: 'All notifications marked as read',
      count 
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('Error in markAllAsRead controller:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Delete a notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const notificationId = Number(req.params.id);
    if (!Number.isInteger(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification id' });
    }

    const deleted = await notificationService.deleteNotification(notificationId, req.user.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('Error in deleteNotification controller:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

