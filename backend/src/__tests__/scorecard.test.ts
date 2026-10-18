import { describe, it, expect } from 'vitest';

interface MockScorecard {
  interviewerId: string;
  ratings: { name: string; rating: number }[];
  summaryFeedback: string;
  status: 'DRAFT' | 'SUBMITTED';
}

function filterScorecardsWithAntiBias(
  scorecards: MockScorecard[],
  requestingUserId: string,
  requestingUserRole: string
): { scorecards: any[]; isBlinded: boolean } {
  const isAdminOrRecruiter = ['ADMIN', 'RECRUITER'].includes(requestingUserRole);
  const myScorecard = scorecards.find((s) => s.interviewerId === requestingUserId);
  const hasSubmittedMyScorecard = myScorecard?.status === 'SUBMITTED';

  // If Admin/Recruiter or interviewer has submitted their own evaluation, unblind all
  if (isAdminOrRecruiter || hasSubmittedMyScorecard) {
    return { scorecards, isBlinded: false };
  }

  // Otherwise, blind/redact all peer reviews
  const blinded = scorecards.map((s) => {
    if (s.interviewerId === requestingUserId) {
      return s;
    }
    return {
      interviewerId: s.interviewerId,
      status: s.status,
      isBlinded: true,
      message: 'Feedback hidden until you submit your own scorecard (Anti-Bias Policy).',
    };
  });

  return { scorecards: blinded, isBlinded: true };
}

describe('Anti-Bias Scorecard Blinding Gate', () => {
  const samplePanelReviews: MockScorecard[] = [
    {
      interviewerId: 'interviewer_1',
      ratings: [{ name: 'System Design', rating: 5 }],
      summaryFeedback: 'Superb architecture understanding.',
      status: 'SUBMITTED',
    },
    {
      interviewerId: 'interviewer_2',
      ratings: [{ name: 'System Design', rating: 3 }],
      summaryFeedback: 'Drafting notes...',
      status: 'DRAFT',
    },
  ];

  it('should REDACT peer reviews if the requesting interviewer has NOT submitted their own evaluation', () => {
    // Interviewer 2 (status: DRAFT) requests the scorecard stream
    const result = filterScorecardsWithAntiBias(samplePanelReviews, 'interviewer_2', 'INTERVIEWER');

    expect(result.isBlinded).toBe(true);

    const peerScorecard = result.scorecards.find((s) => s.interviewerId === 'interviewer_1');
    expect(peerScorecard.isBlinded).toBe(true);
    expect(peerScorecard.ratings).toBeUndefined();
    expect(peerScorecard.summaryFeedback).toBeUndefined();
    expect(peerScorecard.message).toContain('Anti-Bias Policy');

    // But Interviewer 2 can still see their own draft
    const myScorecard = result.scorecards.find((s) => s.interviewerId === 'interviewer_2');
    expect(myScorecard.isBlinded).toBeUndefined();
    expect(myScorecard.ratings).toBeDefined();
  });

  it('should UNBLIND all peer reviews once the interviewer submits their own evaluation', () => {
    // Interviewer 1 (status: SUBMITTED) requests the scorecard stream
    const result = filterScorecardsWithAntiBias(samplePanelReviews, 'interviewer_1', 'INTERVIEWER');

    expect(result.isBlinded).toBe(false);

    const peerScorecard = result.scorecards.find((s) => s.interviewerId === 'interviewer_2');
    expect(peerScorecard.isBlinded).toBeUndefined();
    expect(peerScorecard.summaryFeedback).toBe('Drafting notes...');
  });

  it('should ALWAYS UNBLIND for Recruiters and Admins for governance oversight', () => {
    const recruiterResult = filterScorecardsWithAntiBias(samplePanelReviews, 'recruiter_99', 'RECRUITER');
    expect(recruiterResult.isBlinded).toBe(false);
    expect(recruiterResult.scorecards[0].ratings).toBeDefined();

    const adminResult = filterScorecardsWithAntiBias(samplePanelReviews, 'admin_01', 'ADMIN');
    expect(adminResult.isBlinded).toBe(false);
    expect(adminResult.scorecards[0].ratings).toBeDefined();
  });
});
