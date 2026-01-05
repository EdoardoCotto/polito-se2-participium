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
 *   EMAIL_PORT=587 (STARTTLS) or 465 (SSL/TLS)
 *   EMAIL_SECURE=true (for port 465) or false (for port 587 with STARTTLS)
 *   EMAIL_USER=your.email@example.com
 *   EMAIL_PASS=your_password
 *   Note: Secure connections are enforced. Port 465 uses SSL/TLS, port 587 uses STARTTLS.
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
        requireTLS: true, // Require TLS for secure connections
        tls: {
          rejectUnauthorized: true // Reject unauthorized certificates for security
        },
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      };
    } else if (process.env.EMAIL_HOST) {
      const port = Number.parseInt(process.env.EMAIL_PORT || '587', 10);
      // Port 465 uses SSL/TLS (secure=true), port 587 uses STARTTLS (secure=false but still encrypted)
      // Default to secure connection (port 465) or STARTTLS (port 587)
      const isSecurePort = port === 465;
      const useSecure = process.env.EMAIL_SECURE === 'true' || isSecurePort;
      config = {
        host: process.env.EMAIL_HOST,
        port: port,
        secure: useSecure,
        requireTLS: !useSecure, // Require TLS for STARTTLS connections (port 587)
        tls: {
          rejectUnauthorized: true // Reject unauthorized certificates for security
        },
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
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Confirm your Participium registration</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background: radial-gradient(circle at top left, #0b1220 0%, #111827 45%, #020617 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: #0f172a;
          }
          .outer {
            width: 100%;
            padding: 24px 12px;
          }
          .card {
            max-width: 640px;
            margin: 0 auto;
            background: linear-gradient(180deg, #ffffff 0%, #f3f6fb 100%);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 18px 45px rgba(15, 23, 42, 0.22);
            border: 1px solid rgba(94, 123, 179, 0.18);
          }
          .header {
            background: linear-gradient(135deg, #3d5a8f 0%, #2d4a73 50%, #1e3a5f 100%);
            padding: 28px 32px;
            text-align: center;
            color: #f9fafb;
          }
          .logo-circle {
            display: none;
          }
          .app-name {
            font-size: 22px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #f9fafb;
          }
          .tagline {
            margin-top: 4px;
            font-size: 13px;
            opacity: 0.9;
          }
          .content {
            padding: 28px 32px 10px 32px;
            background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          }
          h2 {
            margin: 0 0 8px 0;
            font-size: 20px;
            color: #0f172a;
          }
          p {
            margin: 4px 0;
            font-size: 14px;
            color: #4b5563;
          }
          .code-box {
            margin: 24px 0 16px 0;
            padding: 20px 24px;
            border-radius: 18px;
            background: linear-gradient(135deg, #e8f0ff 0%, #d6e4ff 45%, #edf2ff 100%);
            border: 1px solid rgba(94, 123, 179, 0.5);
            text-align: center;
          }
          .code-label {
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #3d5a8f;
            margin-bottom: 6px;
          }
          .code {
            display: inline-block;
            padding: 10px 18px;
            border-radius: 999px;
            background: linear-gradient(135deg, #5e7bb3 0%, #4a6fa5 45%, #0d6efd 100%);
            color: #f9fafb;
            font-size: 30px;
            font-weight: 700;
            letter-spacing: 0.4em;
            font-family: 'SF Mono', ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono',
              'Courier New', monospace;
          }
          .meta {
            margin-top: 6px;
            font-size: 12px;
            color: #6b7280;
          }
          .meta strong {
            color: #b91c1c;
          }
          .warning {
            margin-top: 18px;
            font-size: 12px;
            color: #b45309;
          }
          .footer {
            padding: 14px 24px 20px 24px;
            text-align: center;
            font-size: 11px;
            color: #9ca3af;
            background: #0f172a;
          }
          .footer span {
            color: #e5e7eb;
          }
          @media (max-width: 480px) {
            .card {
              border-radius: 0;
            }
            .content {
              padding: 20px 18px 8px 18px;
            }
            .header {
              padding: 22px 18px;
            }
            .code {
              font-size: 24px;
              letter-spacing: 0.32em;
            }
          }
        </style>
      </head>
      <body>
        <div class="outer">
          <div class="card">
            <div class="header">
              <div class="logo-circle"></div>
              <div class="app-name">PARTICIPIUM</div>
              <div class="tagline">Modern citizen reporting for your city</div>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Thank you for registering with <strong>Participium</strong>.</p>
              <p>To complete your registration, enter this confirmation code:</p>

              <div class="code-box">
                <div class="code-label">Your confirmation code</div>
                <div class="code">${confirmationCode}</div>
                <div class="meta">
                  <strong>This code will expire in 30 minutes.</strong>
                </div>
              </div>

              <p>
                Paste this code into the confirmation screen in Participium to activate your account
                and start using the system.
              </p>
              <p class="warning">
                If you did not create an account, you can safely ignore this email and no changes
                will be made.
              </p>
            </div>
            <div class="footer">
              <span>© ${new Date().getFullYear()} Participium.</span> All rights reserved.
            </div>
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
    const htmlMessage = `<p>${message.replaceAll('\n', '<br>')}</p>`;

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

