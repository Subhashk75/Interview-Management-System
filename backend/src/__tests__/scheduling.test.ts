import { describe, it, expect } from 'vitest';

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

    // Panelist A is conflicted; Panelist B is free
    const isPanelistAConflicted = hasConflict(slotStart, slotEnd, 'panelist_A', existing);
    const isPanelistBConflicted = hasConflict(slotStart, slotEnd, 'panelist_B', existing);

    expect(isPanelistAConflicted).toBe(true);
    expect(isPanelistBConflicted).toBe(false);

    // Panel interview validity condition: ALL must be free
    const isPanelAvailable = !isPanelistAConflicted && !isPanelistBConflicted;
    expect(isPanelAvailable).toBe(false);
  });
});
