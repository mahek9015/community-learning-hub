const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async sendVerificationEmail(user) {
    const token = jwt.sign(
      { userId: user._id, type: 'verify' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Verify your email address',
      html: `
        <h1>Welcome to Community Learning Hub!</h1>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(user) {
    const token = jwt.sign(
      { userId: user._id, type: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Reset your password',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendWelcomeEmail(user) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Welcome to Community Learning Hub!',
      html: `
        <h1>Welcome to Community Learning Hub!</h1>
        <p>Thank you for joining our community. We're excited to have you on board!</p>
        <p>Start exploring educational content and earn credit points for your engagement.</p>
        <p>If you have any questions, feel free to reach out to our support team.</p>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }
}

module.exports = new EmailService(); 