import { describe, it, expect } from 'vitest';
import { emailService } from '../modules/notifications/email.service.js';

describe('OTP & Email Notification Service', () => {
  it('should successfully dispatch OTP email and record preview log', async () => {
    const testEmail = 'candidate.test@example.com';
    const testOtp = '849201';
    const res = await emailService.sendOtpEmail(testEmail, 'Alex', testOtp);

    expect(res).toBe(true);

    const logs = emailService.getRecentLogs();
    const foundLog = logs.find((l) => l.to === testEmail && l.otp === testOtp);
    expect(foundLog).toBeDefined();
    expect(foundLog?.preview).toContain('OTP Verification code: 849201');
  });

  it('should format and dispatch interview scheduled notifications to Candidate, Interviewers, and HR', async () => {
    const fakeInterview = {
      _id: 'int_123',
      startTime: new Date('2026-11-01T10:00:00Z'),
      endTime: new Date('2026-11-01T11:00:00Z'),
      meetingUrl: 'https://meet.google.com/test-meet-link',
      status: 'SCHEDULED',
    };

    const fakeCandidate = {
      firstName: 'Emily',
      lastName: 'Zhang',
      email: 'emily.zhang@example.com',
      currentCompany: 'Stripe',
      resumeUrl: 'https://example.com/resume.pdf',
    };

    const fakeJob = {
      title: 'Senior Full Stack Engineer',
      department: 'Product Engineering',
    };

    const fakeRound = {
      name: 'Technical Architecture Round',
      durationMinutes: 60,
    };

    const fakeInterviewers = [
      { firstName: 'David', lastName: 'Kim', email: 'david.kim@acme.com', title: 'Staff Engineer' },
    ];

    const fakeOrganizer = {
      firstName: 'Sarah',
      lastName: 'Connor',
      email: 'admin@acme.com',
    };

    const result = await emailService.sendInterviewScheduledNotifications({
      interview: fakeInterview,
      candidate: fakeCandidate,
      job: fakeJob,
      round: fakeRound,
      interviewers: fakeInterviewers,
      organizer: fakeOrganizer,
    });

    expect(result.candidateSent).toBe(true);
    expect(result.interviewersSent).toBe(true);
    expect(result.hrSent).toBe(true);

    const logs = emailService.getRecentLogs();
    const candidateLog = logs.find((l) => l.to === fakeCandidate.email);
    expect(candidateLog).toBeDefined();
    expect(candidateLog?.meetingUrl).toBe('https://meet.google.com/test-meet-link');
    expect(candidateLog?.subject).toContain('Interview Scheduled: Senior Full Stack Engineer');
  });
});
