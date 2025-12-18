"use strict";

const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

/**
 * Email Service with Multiple Providers
 * 
 * Supports multiple email providers through environment variables:
 * - SendGrid (Recommended for Production)
 * - Gmail
 * - Outlook/Hotmail
 * - Custom SMTP servers
 * 
 * Configuration (add to .env file):
 * 
 * For SendGrid (Recommended):
 *   EMAIL_PROVIDER=sendgrid
 *   SENDGRID_API_KEY=your_api_key_here
 *   EMAIL_FROM=noreply@participium.com
 * 
 * For Gmail:
 *   EMAIL_PROVIDER=gmail
 *   EMAIL_SERVICE=gmail
 *   EMAIL_USER=your.email@gmail.com
 *   EMAIL_PASS=your_app_specific_password
 *   EMAIL_FROM=noreply@participium.com (optional, defaults to EMAIL_USER)
 * 
 * For Outlook/Hotmail:
 *   EMAIL_PROVIDER=smtp
 *   EMAIL_SERVICE=hotmail
 *   EMAIL_USER=your.email@outlook.com
 *   EMAIL_PASS=your_password
 * 
 * For Custom SMTP:
 *   EMAIL_PROVIDER=smtp
 *   EMAIL_HOST=smtp.example.com
 *   EMAIL_PORT=587
 *   EMAIL_SECURE=false
 *   EMAIL_USER=your.email@example.com
 *   EMAIL_PASS=your_password
 * 
 * To get SendGrid API Key:
 * 1. Sign up at https://sendgrid.com (Free 100 emails/day)
 * 2. Go to Settings → API Keys
 * 3. Create API Key with "Full Access"
 * 4. Copy the key to SENDGRID_API_KEY in .env
 * 
 * To get Gmail App Password:
 * 1. Go to Google Account → Security
 * 2. Enable 2-Factor Authentication
 * 3. Go to "App passwords"
 * 4. Generate a new app password for "Mail"
 * 5. Use that password in EMAIL_PASS
 */

/**
 * Initialize email provider based on configuration
 */
function initializeEmailProvider() {
  const provider = process.env.EMAIL_PROVIDER?.toLowerCase();

  // SendGrid configuration
  if (provider === 'sendgrid') {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('⚠️  SendGrid API key not configured. Set SENDGRID_API_KEY environment variable.');
      console.warn('⚠️  Emails will be logged to console instead of being sent.');
      return { type: 'none' };
    }
    
    try {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      console.log('✅ SendGrid email service initialized');
      return { type: 'sendgrid' };
    } catch (error) {
      console.error('❌ Failed to initialize SendGrid:', error.message);
      return { type: 'none' };
    }
  }

  // SMTP configuration (Gmail, Outlook, Custom)
  if (provider === 'smtp' || provider === 'gmail' || !provider) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️  Email not configured. Set EMAIL_USER and EMAIL_PASS environment variables.');
      console.warn('⚠️  Emails will be logged to console instead of being sent.');
      return { type: 'none' };
    }

    let config;
    
    if (process.env.EMAIL_SERVICE) {
      config = {
        service: process.env.EMAIL_SERVICE,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      };
    } else if (process.env.EMAIL_HOST) {
      config = {
        host: process.env.EMAIL_HOST,
        port: Number.parseInt(process.env.EMAIL_PORT || '587', 10),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      };
    } else {
      console.warn('⚠️  Email service not specified. Set EMAIL_SERVICE or EMAIL_HOST.');
      return { type: 'none' };
    }

    try {
      const transporter = nodemailer.createTransport(config);
      console.log('✅ SMTP email service initialized');
      return { type: 'smtp', transporter };
    } catch (error) {
      console.error('❌ Failed to create email transporter:', error.message);
      return { type: 'none' };
    }
  }

  console.warn('⚠️  Unknown email provider. Set EMAIL_PROVIDER to "sendgrid" or "smtp".');
  return { type: 'none' };
}

// Initialize email provider
const emailProvider = initializeEmailProvider();

/**
 * Log email to console (fallback when email is not configured)
 */
function logEmailToConsole(to, subject, content) {
  console.log('='.repeat(60));
  console.log('📧 EMAIL (Not sent - email not configured)');
  console.log('='.repeat(60));
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('-'.repeat(60));
  console.log(content);
  console.log('='.repeat(60));
}

/**
 * Send a confirmation email with a code
 * @param {string} email - recipient email address
 * @param {string} name - recipient name
 * @param {string} confirmationCode - the confirmation code
 * @returns {Promise<boolean>} true if email sent successfully
 */
exports.sendConfirmationEmail = async (email, name, confirmationCode) => {
  const subject = 'Confirm your Participium registration';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .code-box { 
          background-color: white; 
          border: 2px solid #4CAF50; 
          padding: 20px; 
          text-align: center; 
          margin: 20px 0;
          border-radius: 5px;
        }
        .code { 
          font-size: 36px; 
          font-weight: bold; 
          color: #4CAF50; 
          letter-spacing: 5px;
          font-family: 'Courier New', monospace;
        }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .warning { color: #ff9800; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏛️ Participium</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Thank you for registering with Participium!</p>
          <p>To complete your registration, please use the following confirmation code:</p>
          
          <div class="code-box">
            <div class="code">${confirmationCode}</div>
          </div>
          
          <p><strong>⏰ This code will expire in 30 minutes.</strong></p>
          <p>Please enter this code in the confirmation page to activate your account and start using the system.</p>
          <p class="warning">⚠️ If you did not create an account, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Participium. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Hello ${name},

Thank you for registering with Participium!

Your confirmation code is: ${confirmationCode}

This code will expire in 30 minutes.

Please use this code to confirm your registration and activate your account.

If you did not create an account, please ignore this email.

© ${new Date().getFullYear()} Participium. All rights reserved.
  `;

  try {
    // SendGrid
    if (emailProvider.type === 'sendgrid') {
      const msg = {
        to: email,
        from: process.env.EMAIL_FROM || 'noreply@participium.com',
        subject,
        text: textContent,
        html: htmlContent
      };

      await sgMail.send(msg);
      console.log(`✅ Confirmation email sent to ${email} via SendGrid`);
      return true;
    }

    // SMTP (Gmail, Outlook, etc.)
    if (emailProvider.type === 'smtp') {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject,
        text: textContent,
        html: htmlContent
      };

      const info = await emailProvider.transporter.sendMail(mailOptions);
      console.log(`✅ Confirmation email sent to ${email} (Message ID: ${info.messageId})`);
      return true;
    }

    // No email configured - log to console
    logEmailToConsole(email, subject, textContent);
    return true; // Return true so registration still works
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error.message);
    // Log to console as fallback
    logEmailToConsole(email, subject, textContent);
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
    const htmlMessage = `<p>${message.replace(/\n/g, '<br>')}</p>`;

    // SendGrid
    if (emailProvider.type === 'sendgrid') {
      const msg = {
        to: email,
        from: process.env.EMAIL_FROM || 'noreply@participium.com',
        subject,
        text: message,
        html: htmlMessage
      };

      await sgMail.send(msg);
      console.log(`✅ Notification email sent to ${email} via SendGrid`);
      return true;
    }

    // SMTP
    if (emailProvider.type === 'smtp') {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject,
        text: message,
        html: htmlMessage
      };

      const info = await emailProvider.transporter.sendMail(mailOptions);
      console.log(`✅ Notification email sent to ${email} (Message ID: ${info.messageId})`);
      return true;
    }

    // No email configured
    logEmailToConsole(email, subject, message);
    return true;
  } catch (error) {
    console.error('❌ Error sending notification email:', error.message);
    logEmailToConsole(email, subject, message);
    return false;
  }
};

