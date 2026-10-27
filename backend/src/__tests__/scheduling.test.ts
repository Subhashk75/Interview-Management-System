import { describe, it, expect } from 'vitest';
import { lockManager } from '../utils/lockManager.js';

interface MockInterview {
  startTime: Date;
  endTime: Date;
  interviewerId: string;
}

function hasConflict(
  slotStart: Date,
  slotEnd: Date,
  interviewerId: string,
  existingInterviews: MockInterview[],
  bufferMs = 15 * 60 * 1000
): boolean {
  return existingInterviews.some((interview) => {
    if (interview.interviewerId !== interviewerId) return false;
    const existingStart = new Date(interview.startTime.getTime() - bufferMs);
    const existingEnd = new Date(interview.endTime.getTime() + bufferMs);
    return slotStart < existingEnd && slotEnd > existingStart;
  });
}

function isDailyQuotaExceeded(
  targetDate: Date,
  interviewerId: string,
  existingInterviews: MockInterview[],
  dailyLimit: number
): boolean {
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);

  const count = existingInterviews.filter((inv) => {
    return inv.interviewerId === interviewerId && inv.startTime >= dayStart && inv.startTime <= dayEnd;
  }).length;

  return count >= dailyLimit;
}

function isWeeklyCapacityExceeded(
  targetDate: Date,
  interviewerId: string,
  existingInterviews: MockInterview[],
  weeklyCapacityHours: number,
  durationMinutes = 60
): boolean {
  const curr = new Date(targetDate);
  const dayIndex = curr.getDay();
  const monday = new Date(curr);
  monday.setDate(curr.getDate() - (dayIndex === 0 ? 6 : dayIndex - 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const weekInterviews = existingInterviews.filter((inv) => {
    return inv.interviewerId === interviewerId && inv.startTime >= monday && inv.startTime <= sunday;
  });

  const totalHours = weekInterviews.reduce((acc, inv) => {
    return acc + (inv.endTime.getTime() - inv.startTime.getTime()) / (1000 * 60 * 60);
  }, 0);

  return totalHours + durationMinutes / 60 > weeklyCapacityHours;
}

describe('Scheduling Interval Intersection Engine', () => {
  it('should detect direct overlapping interview conflicts', () => {
    const existing: MockInterview[] = [
      {
        interviewerId: 'user_1',
        startTime: new Date('2026-10-20T10:00:00Z'),
        endTime: new Date('2026-10-20T11:00:00Z'),
      },
    ];

    // Candidate slot attempting to book 10:30 - 11:30
    const slotStart = new Date('2026-10-20T10:30:00Z');
    const slotEnd = new Date('2026-10-20T11:30:00Z');

    expect(hasConflict(slotStart, slotEnd, 'user_1', existing)).toBe(true);
  });

  it('should detect buffer window encroachment (15 mins buffer)', () => {
    const existing: MockInterview[] = [
      {
        interviewerId: 'user_1',
        startTime: new Date('2026-10-20T10:00:00Z'),
        endTime: new Date('2026-10-20T11:00:00Z'),
      },
    ];

    // Candidate slot attempting to book 11:05 - 12:05 (only 5 mins buffer instead of required 15 mins)
    const slotStart = new Date('2026-10-20T11:05:00Z');
    const slotEnd = new Date('2026-10-20T12:05:00Z');

    expect(hasConflict(slotStart, slotEnd, 'user_1', existing, 15 * 60 * 1000)).toBe(true);
  });

  it('should permit slot when outside buffer threshold', () => {
    const existing: MockInterview[] = [
      {
        interviewerId: 'user_1',
        startTime: new Date('2026-10-20T10:00:00Z'),
        endTime: new Date('2026-10-20T11:00:00Z'),
      },
    ];

    // Candidate slot attempting to book 11:15 - 12:15 (exact 15 mins buffer)
    const slotStart = new Date('2026-10-20T11:15:00Z');
    const slotEnd = new Date('2026-10-20T12:15:00Z');

    expect(hasConflict(slotStart, slotEnd, 'user_1', existing, 15 * 60 * 1000)).toBe(false);
  });

  it('should require all panelists in a panel interview to be free simultaneously', () => {
    const existing: MockInterview[] = [
      {
        interviewerId: 'panelist_A',
        startTime: new Date('2026-10-20T10:00:00Z'),
        endTime: new Date('2026-10-20T11:00:00Z'),
      },
      {
        interviewerId: 'panelist_B',
        startTime: new Date('2026-10-20T14:00:00Z'),
        endTime: new Date('2026-10-20T15:00:00Z'),
      },
    ];

    const slotStart = new Date('2026-10-20T10:00:00Z');
    const slotEnd = new Date('2026-10-20T11:00:00Z');

    const isPanelistAConflicted = hasConflict(slotStart, slotEnd, 'panelist_A', existing);
    const isPanelistBConflicted = hasConflict(slotStart, slotEnd, 'panelist_B', existing);

    expect(isPanelistAConflicted).toBe(true);
    expect(isPanelistBConflicted).toBe(false);

    const isPanelAvailable = !isPanelistAConflicted && !isPanelistBConflicted;
    expect(isPanelAvailable).toBe(false);
  });

  it('should detect when interviewer daily interview limit has been reached', () => {
    const existing: MockInterview[] = [
      {
        interviewerId: 'user_david',
        startTime: new Date('2026-10-21T09:00:00Z'),
        endTime: new Date('2026-10-21T10:00:00Z'),
      },
      {
        interviewerId: 'user_david',
        startTime: new Date('2026-10-21T14:00:00Z'),
        endTime: new Date('2026-10-21T15:00:00Z'),
      },
    ];

    // Daily limit of 2 interviews per day
    const isExceeded = isDailyQuotaExceeded(new Date('2026-10-21T16:00:00Z'), 'user_david', existing, 2);
    expect(isExceeded).toBe(true);

    // Another day is not exceeded
    const isOtherDayExceeded = isDailyQuotaExceeded(new Date('2026-10-22T10:00:00Z'), 'user_david', existing, 2);
    expect(isOtherDayExceeded).toBe(false);
  });

  it('should detect when interviewer weekly capacity hours quota has been exceeded', () => {
    // Week of Oct 19 - Oct 25, 2026
    const existing: MockInterview[] = [
      {
        interviewerId: 'user_david',
        startTime: new Date('2026-10-19T10:00:00Z'),
        endTime: new Date('2026-10-19T12:00:00Z'), // 2 hours
      },
      {
        interviewerId: 'user_david',
        startTime: new Date('2026-10-20T10:00:00Z'),
        endTime: new Date('2026-10-20T12:00:00Z'), // 2 hours (total 4 hrs)
      },
    ];

    // Weekly capacity of 4 hours
    // Attempting to book 1 more hour on Oct 21 would bring total to 5 hours > 4 hours
    const isExceeded = isWeeklyCapacityExceeded(
      new Date('2026-10-21T10:00:00Z'),
      'user_david',
      existing,
      4,
      60
    );
    expect(isExceeded).toBe(true);
  });

  it('should serialize concurrent operations via AsyncLockManager', async () => {
    const executionOrder: string[] = [];
    const lockKeys = ['interviewer:david', 'candidate:emily'];

    const job1 = async () => {
      await lockManager.withLock(lockKeys, async () => {
        executionOrder.push('job1-start');
        await new Promise((resolve) => setTimeout(resolve, 30));
        executionOrder.push('job1-end');
      });
    };

    const job2 = async () => {
      await lockManager.withLock(lockKeys, async () => {
        executionOrder.push('job2-start');
        await new Promise((resolve) => setTimeout(resolve, 10));
        executionOrder.push('job2-end');
      });
    };

    await Promise.all([job1(), job2()]);

    // Guaranteed to serialize: either job1 finishes completely then job2 runs, or vice versa
    const validSequence1 = ['job1-start', 'job1-end', 'job2-start', 'job2-end'];
    const validSequence2 = ['job2-start', 'job2-end', 'job1-start', 'job1-end'];

    const isValid =
      JSON.stringify(executionOrder) === JSON.stringify(validSequence1) ||
      JSON.stringify(executionOrder) === JSON.stringify(validSequence2);

    expect(isValid).toBe(true);
  });
});
