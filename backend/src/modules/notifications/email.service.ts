import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { NotificationType } from '@prisma/client';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailConfig = {
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    };

    // Only create transporter if SMTP credentials are configured
    if (emailConfig.auth.user && emailConfig.auth.pass) {
      this.transporter = nodemailer.createTransport(emailConfig);
      this.logger.log('Email service initialized successfully');
    } else {
      this.logger.warn('SMTP credentials not configured. Email notifications will be disabled.');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email transporter not initialized. Skipping email send.');
      return false;
    }

    try {
      const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM', 'noreply@examportal.com'),
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      return false;
    }
  }

  async sendNotificationEmail(
    email: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: any,
  ): Promise<boolean> {
    const subject = this.getEmailSubject(type, title);
    const html = this.buildEmailTemplate(type, title, message, metadata);

    return this.sendEmail({
      to: email,
      subject,
      html,
      text: message,
    });
  }

  private getEmailSubject(type: NotificationType, title: string): string {
    const subjectMap: Record<NotificationType, string> = {
      EXAM_CREATED: '🎓 New Exam Available',
      EXAM_UPDATED: '📝 Exam Updated',
      EXAM_REMINDER: '⏰ Exam Reminder',
      EXAM_STARTED: '🚀 Exam Started',
      EXAM_ENDING: '⏱️ Exam Ending Soon',
      EXAM_ENDED: '🏁 Exam Ended',
      MESSAGE_RECEIVED: '💬 New Message',
      SUSPICIOUS_ACTIVITY: '⚠️ Security Alert',
      TAB_SWITCH_WARNING: '⚠️ Tab Switch Detected',
      SCREEN_SHARING_DETECTED: '⚠️ Screen Sharing Detected',
      COPY_PASTE_ATTEMPT: '⚠️ Copy/Paste Attempt',
      IP_VIOLATION: '⚠️ IP Address Violation',
      FINGERPRINT_MISMATCH: '⚠️ Browser Fingerprint Mismatch',
      SYSTEM: '📢 System Notification',
      GRADE_PUBLISHED: '📊 Your Grade is Ready',
      ATTEMPT_SUBMITTED: '✅ Exam Submitted',
    };

    return `${subjectMap[type] || '📬 Notification'} - ${title}`;
  }

  private buildEmailTemplate(
    type: NotificationType,
    title: string,
    message: string,
    metadata?: any,
  ): string {
    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 30px 20px;
            }
            .notification-type {
              display: inline-block;
              padding: 6px 12px;
              background: #f0f0f0;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              margin-bottom: 15px;
            }
            .message {
              background: #f9f9f9;
              padding: 20px;
              border-left: 4px solid #667eea;
              margin: 20px 0;
              border-radius: 4px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #667eea;
              color: white !important;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: 600;
            }
            .button:hover {
              background: #5568d3;
            }
            .footer {
              background: #f9f9f9;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #e0e0e0;
            }
            .metadata {
              margin-top: 20px;
              padding: 15px;
              background: #f0f0f0;
              border-radius: 4px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📚 Online Exam System</h1>
            </div>
            <div class="content">
              <span class="notification-type">${type}</span>
              <h2>${title}</h2>
              <div class="message">
                ${message}
              </div>
              ${metadata ? `
                <div class="metadata">
                  ${this.formatMetadata(metadata)}
                </div>
              ` : ''}
              <a href="${appUrl}/dashboard" class="button">Go to Dashboard</a>
            </div>
            <div class="footer">
              <p>This is an automated notification from Online Exam System.</p>
              <p>If you don't want to receive these emails, you can update your notification preferences in your account settings.</p>
              <p>&copy; ${new Date().getFullYear()} Online Exam System. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private formatMetadata(metadata: any): string {
    if (!metadata || typeof metadata !== 'object') {
      return '';
    }

    return Object.entries(metadata)
      .map(([key, value]) => `<strong>${this.formatKey(key)}:</strong> ${value}`)
      .join('<br>');
  }

  private formatKey(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  async sendBulkEmails(emails: EmailOptions[]): Promise<number> {
    let successCount = 0;

    for (const email of emails) {
      const success = await this.sendEmail(email);
      if (success) successCount++;
    }

    this.logger.log(`Bulk email send completed: ${successCount}/${emails.length} successful`);
    return successCount;
  }
}
