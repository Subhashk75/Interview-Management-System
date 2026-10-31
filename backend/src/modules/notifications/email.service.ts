import nodemailer from 'nodemailer';
import { logger } from '../../utils/logger.js';

export interface EmailLogEntry {
  id: string;
  to: string;
  subject: string;
  meetingUrl?: string;
  otp?: string;
  sentAt: Date;
  preview: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private sentLogs: EmailLogEntry[] = [];

  constructor() {
    this.initTransporter();
  }

  private async initTransporter() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      logger.info('📧 Nodemailer configured with production SMTP server');
    } else {
      // In development or test without SMTP, configure a stream transport or ethereal test account
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'windows',
        buffer: true,
      });
      logger.info('📧 Nodemailer initialized with mock/preview transport (dev mode)');
    }
  }

  /**
   * Sends 6-digit OTP verification code to newly registered or unverified user
   */
  async sendOtpEmail(email: string, firstName: string, otp: string): Promise<boolean> {
    const subject = `Your Verification Code: ${otp} - Interview Management System`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; padding: 32px; border-radius: 16px; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #38bdf8; margin: 0; font-size: 24px;">Interview Management System</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Email Verification & Security</p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1;">Hi <strong>${firstName}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">Thank you for registering. Use the 6-digit verification code below to verify your email address and activate your account:</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <div style="display: inline-block; background-color: #1e293b; border: 2px dashed #38bdf8; border-radius: 12px; padding: 16px 36px;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; font-family: monospace;">${otp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 10px;">This code is valid for <strong>10 minutes</strong>.</p>
        </div>

        <p style="font-size: 14px; color: #94a3b8; line-height: 1.5;">If you did not request this verification code, please ignore this email.</p>
        
        <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">© 2026 Interview Management System. All rights reserved.</p>
      </div>
    `;

    const sender = process.env.SMTP_FROM || process.env.SMTP_USER || '"Interview Management Platform" <no-reply@ims.company>';

    try {
      if (this.transporter) {
        await this.transporter.sendMail({
          from: sender,
          to: email,
          subject,
          html,
        });
      }

      this.recordLog({
        id: Math.random().toString(36).substring(2, 9),
        to: email,
        subject,
        otp,
        sentAt: new Date(),
        preview: `OTP Verification code: ${otp} sent to ${email}`,
      });

      logger.info(`🔑 [EMAIL DISPATCHED] OTP [${otp}] sent to ${email}`);
      return true;
    } catch (err: any) {
      logger.error(`Failed to send OTP email to ${email}:`, err);
      return false;
    }
  }

  /**
   * Sends automated interview schedule emails with video meeting links to:
   * 1. Candidate
   * 2. Interviewer(s)
   * 3. HR / Recruiter (Organizer)
   */
  async sendInterviewScheduledNotifications(params: {
    interview: any;
    candidate: any;
    job: any;
    round: any;
    interviewers: any[];
    organizer?: any;
  }): Promise<{ candidateSent: boolean; interviewersSent: boolean; hrSent: boolean }> {
    const { interview, candidate, job, round, interviewers, organizer } = params;

    const formattedDate = new Date(interview.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formattedStartTime = new Date(interview.startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    const formattedEndTime = new Date(interview.endTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    const meetingUrl = interview.meetingUrl || 'https://meet.google.com/ims-auto-session';
    const interviewerNames = interviewers.map((i) => `${i.firstName} ${i.lastName} (${i.title || 'Panelist'})`).join(', ');

    // 1. Email to Candidate
    const candidateSubject = `Interview Scheduled: ${job.title} - ${round.name}`;
    const candidateHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; padding: 32px; border-radius: 16px; border: 1px solid #1e293b;">
        <div style="border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 24px;">
          <h2 style="color: #38bdf8; margin: 0; font-size: 22px;">Interview Confirmation</h2>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Role: <strong>${job.title}</strong> (${job.department})</p>
        </div>

        <p style="font-size: 16px; color: #cbd5e1;">Dear <strong>${candidate.firstName}</strong>,</p>
        <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">
          Your interview session for <strong>${job.title}</strong> has been confirmed. Below are your round details and video meeting link:
        </p>

        <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #38bdf8;">
          <p style="margin: 6px 0; font-size: 14px;"><strong>Round:</strong> ${round.name} (${round.durationMinutes || 60} mins)</p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Date:</strong> ${formattedDate}</p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Time:</strong> ${formattedStartTime} – ${formattedEndTime}</p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Interviewers:</strong> ${interviewerNames}</p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${meetingUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px rgba(37,99,235,0.4);">
            🎥 Join Video Meeting (Google Meet)
          </a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 10px; word-break: break-all;">
            Direct link: <a href="${meetingUrl}" style="color: #38bdf8;">${meetingUrl}</a>
          </p>
        </div>

        <div style="background-color: #0284c715; border: 1px solid #0284c730; border-radius: 8px; padding: 14px; margin-top: 20px;">
          <p style="margin: 0; font-size: 13px; color: #7dd3fc;">
            💡 <strong>Preparation Tip:</strong> Please ensure your camera and microphone are tested beforehand and join 2 minutes early.
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">© 2026 Interview Management System</p>
      </div>
    `;

    // 2. Email to Assigned Interviewers
    const interviewerSubject = `[Interview Panel] ${candidate.firstName} ${candidate.lastName} - ${round.name}`;
    const interviewerHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; padding: 32px; border-radius: 16px; border: 1px solid #1e293b;">
        <div style="border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 24px;">
          <h2 style="color: #38bdf8; margin: 0; font-size: 22px;">Panelist Assignment Notice</h2>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Candidate: <strong>${candidate.firstName} ${candidate.lastName}</strong></p>
        </div>

        <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">
          You have been assigned to conduct an interview round for the <strong>${job.title}</strong> pipeline.
        </p>

        <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #10b981;">
          <p style="margin: 6px 0; font-size: 14px;"><strong>Candidate:</strong> ${candidate.firstName} ${candidate.lastName} (${candidate.email})</p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Current Company:</strong> ${candidate.currentCompany || 'N/A'}</p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Round:</strong> ${round.name} (${round.durationMinutes || 60} mins)</p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Date & Time:</strong> ${formattedDate} at ${formattedStartTime} – ${formattedEndTime}</p>
          ${candidate.resumeUrl ? `<p style="margin: 6px 0; font-size: 14px;"><strong>Resume:</strong> <a href="${candidate.resumeUrl}" target="_blank" style="color: #38bdf8;">View Candidate Resume</a></p>` : ''}
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${meetingUrl}" target="_blank" style="background-color: #059669; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; display: inline-block;">
            🎥 Join Interview Room
          </a>
        </div>

        <p style="font-size: 13px; color: #94a3b8;">
          📝 <em>Reminder:</em> Please fill in your structured scorecard immediately after the interview. Anti-bias blinding will prevent other panelists' submissions from being viewed until yours is submitted.
        </p>

        <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">© 2026 Interview Management System</p>
      </div>
    `;

    // 3. Email to HR / Recruiter (Organizer)
    const hrEmail = organizer?.email || (job.recruiterId?.email || 'recruiter@acme.com');
    const hrSubject = `[HR Confirmation] Interview Scheduled: ${candidate.firstName} ${candidate.lastName} for ${job.title}`;
    const hrHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; padding: 32px; border-radius: 16px; border: 1px solid #1e293b;">
        <div style="border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 24px;">
          <h2 style="color: #38bdf8; margin: 0; font-size: 22px;">HR Interview Confirmation</h2>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Lifecycle Tracking & Calendar Sync</p>
        </div>

        <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">
          An interview round has been successfully booked and synchronized with calendar invitations.
        </p>

        <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #8b5cf6;">
          <p style="margin: 6px 0; font-size: 14px;"><strong>Job:</strong> ${job.title} (${job.department})</p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Candidate:</strong> ${candidate.firstName} ${candidate.lastName} (${candidate.email})</p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Round:</strong> ${round.name}</p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Assigned Panel:</strong> ${interviewerNames}</p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Scheduled Time:</strong> ${formattedDate}, ${formattedStartTime} – ${formattedEndTime}</p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Meeting Link:</strong> <a href="${meetingUrl}" style="color: #38bdf8;">${meetingUrl}</a></p>
        </div>

        <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">© 2026 Interview Management System</p>
      </div>
    `;

    let candidateSent = false;
    let interviewersSent = false;
    let hrSent = false;

    const sender = process.env.SMTP_FROM || process.env.SMTP_USER || '"Acme Talent Acquisition" <interviews@acme.com>';

    // Send Candidate email
    try {
      if (candidate.email) {
        if (this.transporter) {
          await this.transporter.sendMail({
            from: sender,
            to: candidate.email,
            subject: candidateSubject,
            html: candidateHtml,
          });
        }
        this.recordLog({
          id: Math.random().toString(36).substring(2, 9),
          to: candidate.email,
          subject: candidateSubject,
          meetingUrl,
          sentAt: new Date(),
          preview: `Candidate interview invite for ${round.name} with meeting link: ${meetingUrl}`,
        });
        candidateSent = true;
        logger.info(`📧 [EMAIL TO CANDIDATE] Sent to ${candidate.email} (Meet Link: ${meetingUrl})`);
      }
    } catch (err: any) {
      logger.error('Failed to send candidate email:', err);
    }

    // Send Interviewers email
    try {
      for (const inv of interviewers) {
        if (inv.email) {
          if (this.transporter) {
            await this.transporter.sendMail({
              from: sender,
              to: inv.email,
              subject: interviewerSubject,
              html: interviewerHtml,
            });
          }
          this.recordLog({
            id: Math.random().toString(36).substring(2, 9),
            to: inv.email,
            subject: interviewerSubject,
            meetingUrl,
            sentAt: new Date(),
            preview: `Interviewer panel notification sent to ${inv.email} with meeting link: ${meetingUrl}`,
          });
          logger.info(`📧 [EMAIL TO INTERVIEWER] Sent to ${inv.email}`);
        }
      }
      interviewersSent = true;
    } catch (err: any) {
      logger.error('Failed to send interviewer emails:', err);
    }

    // Send HR / Recruiter email
    try {
      if (hrEmail) {
        if (this.transporter) {
          await this.transporter.sendMail({
            from: sender,
            to: hrEmail,
            subject: hrSubject,
            html: hrHtml,
          });
        }
        this.recordLog({
          id: Math.random().toString(36).substring(2, 9),
          to: hrEmail,
          subject: hrSubject,
          meetingUrl,
          sentAt: new Date(),
          preview: `HR confirmation email sent to ${hrEmail} for candidate ${candidate.firstName} ${candidate.lastName}`,
        });
        hrSent = true;
        logger.info(`📧 [EMAIL TO HR] Sent to ${hrEmail}`);
      }
    } catch (err: any) {
      logger.error('Failed to send HR confirmation email:', err);
    }

    return { candidateSent, interviewersSent, hrSent };
  }

  private recordLog(entry: EmailLogEntry) {
    this.sentLogs.unshift(entry);
    if (this.sentLogs.length > 50) {
      this.sentLogs.pop();
    }
  }

  getRecentLogs(): EmailLogEntry[] {
    return this.sentLogs;
  }
}

export const emailService = new EmailService();
