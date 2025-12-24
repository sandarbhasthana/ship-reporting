import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface WelcomeEmailData {
  organizationName: string;
  adminName: string;
  adminEmail: string;
  temporaryPassword: string;
  loginUrl: string;
}

export interface UserOnboardingEmailData {
  userName: string;
  userEmail: string;
  organizationName: string;
  role: string;
  temporaryPassword: string;
  loginUrl: string;
}

export interface PasswordResetEmailData {
  userName: string;
  resetUrl: string;
  expiresIn: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly isConfigured: boolean;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    this.fromEmail =
      this.configService.get<string>('SENDGRID_FROM_EMAIL') ||
      'noreply@shipreporting.com';
    this.fromName =
      this.configService.get<string>('SENDGRID_FROM_NAME') || 'Ship Reporting';

    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.isConfigured = true;
      this.logger.log('SendGrid email service configured successfully');
    } else {
      this.isConfigured = false;
      this.logger.warn(
        'SendGrid API key not configured. Emails will be logged only.',
      );
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    const msg = {
      to: options.to,
      from: {
        email: this.fromEmail,
        name: this.fromName,
      },
      subject: options.subject,
      text: options.text || '',
      html: options.html || options.text || '',
    };

    if (!this.isConfigured) {
      this.logger.log(`[EMAIL MOCK] To: ${options.to}`);
      this.logger.log(`[EMAIL MOCK] Subject: ${options.subject}`);
      this.logger.log(`[EMAIL MOCK] Body: ${options.text || options.html}`);
      return true;
    }

    try {
      await sgMail.send(msg);
      this.logger.log(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
      return false;
    }
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    const subject = `Welcome to Ship Reporting - ${data.organizationName}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #a05aff 0%, #7340bf 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; }
          .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #a05aff; }
          .credentials p { margin: 8px 0; }
          .credentials strong { color: #a05aff; }
          .button { display: inline-block; background: #a05aff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
          .button:hover { background: #8a4ae0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚢 Welcome to Ship Reporting</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${data.adminName}</strong>,</p>
            <p>Your organization <strong>${data.organizationName}</strong> has been successfully created on Ship Reporting platform.</p>
            <p>Here are your login credentials:</p>
            <div class="credentials">
              <p><strong>Email:</strong> ${data.adminEmail}</p>
              <p><strong>Temporary Password:</strong> ${data.temporaryPassword}</p>
            </div>
            <p>⚠️ Please change your password after your first login for security.</p>
            <a href="${data.loginUrl}" class="button">Login to Ship Reporting</a>
          </div>
          <div class="footer">
            <p>This email was sent by Ship Reporting. If you didn't request this, please ignore.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to Ship Reporting!

Hello ${data.adminName},

Your organization ${data.organizationName} has been successfully created.

Login Credentials:
Email: ${data.adminEmail}
Temporary Password: ${data.temporaryPassword}

Please change your password after your first login.

Login URL: ${data.loginUrl}
    `;

    return this.sendEmail({
      to: data.adminEmail,
      subject,
      html,
      text,
    });
  }

  async sendPasswordResetEmail(
    data: PasswordResetEmailData & { email: string },
  ): Promise<boolean> {
    const subject = 'Reset Your Ship Reporting Password';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #a05aff 0%, #7340bf 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; }
          .button { display: inline-block; background: #a05aff; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 500; }
          .button:hover { background: #8a4ae0; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${data.userName}</strong>,</p>
            <p>We received a request to reset your password for your Ship Reporting account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${data.resetUrl}" class="button">Reset Password</a>
            <div class="warning">
              <p><strong>⏱️ This link expires in ${data.expiresIn}.</strong></p>
              <p>If you didn't request this password reset, you can safely ignore this email.</p>
            </div>
          </div>
          <div class="footer">
            <p>This email was sent by Ship Reporting. Never share your password with anyone.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Password Reset Request

Hello ${data.userName},

We received a request to reset your password for your Ship Reporting account.

Click the link below to reset your password:
${data.resetUrl}

This link expires in ${data.expiresIn}.

If you didn't request this password reset, you can safely ignore this email.
    `;

    return this.sendEmail({
      to: data.email,
      subject,
      html,
      text,
    });
  }

  async sendUserOnboardingEmail(
    data: UserOnboardingEmailData,
  ): Promise<boolean> {
    const subject = `Welcome to ${data.organizationName} - Ship Reporting`;
    const roleDisplay =
      data.role === 'CAPTAIN'
        ? 'Captain'
        : data.role === 'ADMIN'
          ? 'Administrator'
          : data.role;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #a05aff 0%, #7340bf 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; }
          .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #a05aff; }
          .credentials p { margin: 8px 0; }
          .credentials strong { color: #a05aff; }
          .role-badge { display: inline-block; background: #a05aff; color: white; padding: 4px 12px; border-radius: 4px; font-size: 14px; }
          .button { display: inline-block; background: #a05aff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
          .button:hover { background: #8a4ae0; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚢 Welcome to Ship Reporting</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${data.userName}</strong>,</p>
            <p>You have been added to <strong>${data.organizationName}</strong> as a <span class="role-badge">${roleDisplay}</span>.</p>
            <p>Here are your login credentials:</p>
            <div class="credentials">
              <p><strong>Email:</strong> ${data.userEmail}</p>
              <p><strong>Temporary Password:</strong> ${data.temporaryPassword}</p>
            </div>
            <div class="warning">
              <p><strong>⚠️ Important:</strong> Please change your password after your first login for security.</p>
            </div>
            <a href="${data.loginUrl}" class="button">Login to Ship Reporting</a>
          </div>
          <div class="footer">
            <p>This email was sent by Ship Reporting. If you didn't expect this, please contact your administrator.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to Ship Reporting!

Hello ${data.userName},

You have been added to ${data.organizationName} as a ${roleDisplay}.

Login Credentials:
Email: ${data.userEmail}
Temporary Password: ${data.temporaryPassword}

Please change your password after your first login for security.

Login URL: ${data.loginUrl}

If you didn't expect this email, please contact your administrator.
    `;

    return this.sendEmail({
      to: data.userEmail,
      subject,
      html,
      text,
    });
  }
}
