const notificationDao = require('../dao/notificationDao');
const userDao = require('../dao/userDao');
const reportDao = require('../dao/reportDao');
const emailService = require('./emailService');
const REPORT_STATUSES = require('../constants/reportStatus');

/**
 * Get status display name for notifications
 * @param {string} status
 * @returns {string}
 */
const getStatusDisplayName = (status) => {
  const statusMap = {
    [REPORT_STATUSES.PENDING]: 'Pending',
    [REPORT_STATUSES.ASSIGNED]: 'Assigned',
    [REPORT_STATUSES.REJECTED]: 'Rejected',
    [REPORT_STATUSES.PROGRESS]: 'In Progress',
    [REPORT_STATUSES.SUSPENDED]: 'Suspended',
    [REPORT_STATUSES.RESOLVED]: 'Resolved'
  };
  return statusMap[status] || status;
};

/**
 * Create a notification for a report status change
 * @param {number} reportId
 * @param {string} newStatus
 * @param {string} oldStatus
 * @param {string} rejectionReason - Optional, only for rejected reports
 * @returns {Promise<void>}
 */
exports.createStatusChangeNotification = async (reportId, newStatus, oldStatus, rejectionReason = null) => {
  try {
    // Get the report to find the citizen who created it
    const report = await reportDao.getReportById(reportId);
    if (!report) {
      console.error(`Report ${reportId} not found for notification`);
      return;
    }

    const citizenId = report.userId;
    if (!citizenId) {
      console.error(`Report ${reportId} has no userId`);
      return;
    }

    // Get citizen details for email notification
    const citizen = await userDao.getUserById(citizenId);
    if (!citizen) {
      console.error(`Citizen ${citizenId} not found for notification`);
      return;
    }

    // Create notification title and message
    const statusDisplayName = getStatusDisplayName(newStatus);
    const title = `Report Status Updated: ${statusDisplayName}`;
    
    let message = `Your report "${report.title}" status has been updated from ${getStatusDisplayName(oldStatus)} to ${statusDisplayName}.`;
    
    if (newStatus === REPORT_STATUSES.REJECTED && rejectionReason) {
      message += `\n\nReason: ${rejectionReason}`;
    } else if (newStatus === REPORT_STATUSES.ASSIGNED) {
      message += `\n\nThe report has been assigned to a technical office and is being reviewed.`;
    } else if (newStatus === REPORT_STATUSES.PROGRESS) {
      message += `\n\nWork on your report has started.`;
    } else if (newStatus === REPORT_STATUSES.SUSPENDED) {
      message += `\n\nWork on your report has been temporarily suspended.`;
    } else if (newStatus === REPORT_STATUSES.RESOLVED) {
      message += `\n\nYour report has been resolved! Thank you for your contribution.`;
    }

    // Create notification in database
    await notificationDao.createNotification({
      userId: citizenId,
      reportId: reportId,
      title: title,
      message: message
    });

    // Send email notification if enabled
    if (citizen.mail_notifications === 1 && citizen.email) {
      const emailSubject = `Report Status Update: ${report.title}`;
      await emailService.sendNotificationEmail(citizen.email, emailSubject, message);
    }

    console.log(`✅ Notification created for report ${reportId} status change: ${oldStatus} -> ${newStatus}`);
  } catch (error) {
    console.error(`❌ Error creating status change notification for report ${reportId}:`, error);
    // Don't throw - notification failure shouldn't break the status update
  }
};

/**
 * Get all notifications for a user
 * @param {number} userId
 * @returns {Promise<Object[]>}
 */
exports.getUserNotifications = async (userId) => {
  return await notificationDao.getNotificationsByUserId(userId);
};

/**
 * Get unread notifications for a user
 * @param {number} userId
 * @returns {Promise<Object[]>}
 */
exports.getUnreadNotifications = async (userId) => {
  return await notificationDao.getUnreadNotificationsByUserId(userId);
};

/**
 * Mark a notification as read
 * @param {number} notificationId
 * @param {number} userId
 * @returns {Promise<Object|null>}
 */
exports.markAsRead = async (notificationId, userId) => {
  return await notificationDao.markNotificationAsRead(notificationId, userId);
};

/**
 * Mark all notifications as read for a user
 * @param {number} userId
 * @returns {Promise<number>}
 */
exports.markAllAsRead = async (userId) => {
  return await notificationDao.markAllNotificationsAsRead(userId);
};

/**
 * Delete a notification
 * @param {number} notificationId
 * @param {number} userId
 * @returns {Promise<boolean>}
 */
exports.deleteNotification = async (notificationId, userId) => {
  return await notificationDao.deleteNotification(notificationId, userId);
};

