"use strict";

/**
 * Email Service
 * 
 * This service handles sending emails for various purposes like
 * registration confirmation, password reset, etc.
 * 
 * For now, this is a mock implementation that logs emails to console.
 * In production, this should be replaced with a real email provider
 * like SendGrid, AWS SES, Nodemailer with SMTP, etc.
 */

/**
 * Send a confirmation email with a code
 * @param {string} email - recipient email address
 * @param {string} name - recipient name
 * @param {string} confirmationCode - the confirmation code
 * @returns {Promise<boolean>} true if email sent successfully
 */
exports.sendConfirmationEmail = async (email, name, confirmationCode) => {
  try {
    // TODO: Replace this with real email sending logic
    console.log('='.repeat(60));
    console.log('📧 CONFIRMATION EMAIL');
    console.log('='.repeat(60));
    console.log(`To: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`Subject: Confirm your Participium registration`);
    console.log('-'.repeat(60));
    console.log(`Hello ${name},`);
    console.log('');
    console.log('Thank you for registering with Participium!');
    console.log('');
    console.log('Your confirmation code is:');
    console.log('');
    console.log(`    ${confirmationCode}`);
    console.log('');
    console.log('This code will expire in 30 minutes.');
    console.log('');
    console.log('Please use this code to confirm your registration and activate your account.');
    console.log('');
    console.log('If you did not create an account, please ignore this email.');
    console.log('='.repeat(60));
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return false;
  }
};

/**
 * Send a notification email (for future use)
 * @param {string} email - recipient email address
 * @param {string} subject - email subject
 * @param {string} message - email message
 * @returns {Promise<boolean>} true if email sent successfully
 */
exports.sendNotificationEmail = async (email, subject, message) => {
  try {
    // TODO: Replace this with real email sending logic
    console.log('='.repeat(60));
    console.log('📧 NOTIFICATION EMAIL');
    console.log('='.repeat(60));
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log('-'.repeat(60));
    console.log(message);
    console.log('='.repeat(60));
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true;
  } catch (error) {
    console.error('Error sending notification email:', error);
    return false;
  }
};

