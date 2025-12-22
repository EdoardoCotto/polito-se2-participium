"use strict";

// Unit tests to cover initialization and send flows in emailService

const originalEnv = { ...process.env };

// Mocks for providers
jest.mock('nodemailer', () => {
  const sendMail = jest.fn().mockResolvedValue({ messageId: 'msg-1' });
  return {
    createTransport: jest.fn(() => ({ sendMail })),
    __sendMail: sendMail,
  };
});

jest.mock('@sendgrid/mail', () => {
  return {
    setApiKey: jest.fn(),
    send: jest.fn().mockResolvedValue(true),
    __send: null,
  };
});

// Helper to reload module with env
function loadEmailServiceWithEnv(env) {
  jest.resetModules();
  process.env = { ...originalEnv, ...env };
  return require('../../server/services/emailService');
}

describe('emailService initializeEmailProvider and sending', () => {
  afterAll(() => { process.env = originalEnv; });

  test('SendGrid: missing API key logs and uses none', async () => {
    const svc = loadEmailServiceWithEnv({ EMAIL_PROVIDER: 'sendgrid', SENDGRID_API_KEY: '' });
    const ok = await svc.sendConfirmationEmail('a@b.com', 'A', '123456');
    expect(ok).toBe(true); // logs to console path
  });

  test('SendGrid: with API key sends via sgMail', async () => {
    const svc = loadEmailServiceWithEnv({ EMAIL_PROVIDER: 'sendgrid', SENDGRID_API_KEY: 'key' });
    const sg = require('@sendgrid/mail');
    const ok = await svc.sendConfirmationEmail('a@b.com', 'A', '123456');
    expect(sg.setApiKey).toHaveBeenCalledWith('key');
    expect(ok).toBe(true);
  });

  test('SMTP: service config sends via transporter', async () => {
    const svc = loadEmailServiceWithEnv({ EMAIL_PROVIDER: 'smtp', EMAIL_SERVICE: 'gmail', EMAIL_USER: 'u', EMAIL_PASS: 'p', EMAIL_FROM: 'f@x.com' });
    const nodemailer = require('nodemailer');
    const ok = await svc.sendConfirmationEmail('a@b.com', 'A', '123456');
    expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({ service: 'gmail' }));
    expect(ok).toBe(true);
  });

  test('SMTP: host config sends via transporter', async () => {
    const svc = loadEmailServiceWithEnv({ EMAIL_PROVIDER: 'smtp', EMAIL_HOST: 'smtp.example.com', EMAIL_PORT: '2525', EMAIL_SECURE: 'false', EMAIL_USER: 'u', EMAIL_PASS: 'p' });
    const nodemailer = require('nodemailer');
    const ok = await svc.sendNotificationEmail('a@b.com', 'Hello', 'Message');
    expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({ host: 'smtp.example.com' }));
    expect(ok).toBe(true);
  });

  test('SMTP: missing credentials falls back to console', async () => {
    const svc = loadEmailServiceWithEnv({ EMAIL_PROVIDER: 'smtp', EMAIL_USER: '', EMAIL_PASS: '' });
    const ok = await svc.sendNotificationEmail('a@b.com', 'Hi', 'Msg');
    expect(ok).toBe(true);
  });

  test('Unknown provider falls back to console', async () => {
    const svc = loadEmailServiceWithEnv({ EMAIL_PROVIDER: 'unknown' });
    const ok = await svc.sendNotificationEmail('a@b.com', 'Hi', 'Msg');
    expect(ok).toBe(true);
  });

  test('SendGrid: send throws -> returns false but logs', async () => {
    const svc = loadEmailServiceWithEnv({ EMAIL_PROVIDER: 'sendgrid', SENDGRID_API_KEY: 'key' });
    const sg = require('@sendgrid/mail');
    sg.send.mockRejectedValueOnce(new Error('fail'));
    const ok = await svc.sendConfirmationEmail('a@b.com', 'A', '123456');
    expect(ok).toBe(false);
  });

  test('SMTP: transporter throws -> returns false', async () => {
    const svc = loadEmailServiceWithEnv({ EMAIL_PROVIDER: 'smtp', EMAIL_SERVICE: 'gmail', EMAIL_USER: 'u', EMAIL_PASS: 'p' });
    const nodemailer = require('nodemailer');
    nodemailer.__sendMail.mockRejectedValueOnce(new Error('smtp-fail'));
    const ok = await svc.sendNotificationEmail('a@b.com', 'Hi', 'Msg');
    expect(ok).toBe(false);
  });
});
