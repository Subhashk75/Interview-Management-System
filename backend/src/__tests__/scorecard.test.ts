import { describe, it, expect } from 'vitest';
import { scorecardService } from '../modules/scorecards/scorecard.service.js';

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

describe('Dynamic Weighted Score Calculations', () => {
  it('should correctly calculate weighted score with differing competency weights', () => {
    const roundCompetencies = [
      { name: 'System Design', weight: 3 },
      { name: 'Coding & Algorithms', weight: 2 },
      { name: 'Communication', weight: 1 },
    ];

    const ratings = [
      { name: 'System Design', rating: 5 },       // 5 * 3 = 15
      { name: 'Coding & Algorithms', rating: 4 },  // 4 * 2 = 8
      { name: 'Communication', rating: 3 },        // 3 * 1 = 3
    ];
    // Total weighted score = 26, Total weight = 6 -> 26 / 6 = 4.3333... -> 4.33

    const weighted = scorecardService.calculateWeightedScore(ratings, roundCompetencies);
    expect(weighted).toBe(4.33);
  });

  it('should fallback to weight 1 if competency is not specified in round or weight is 0/undefined', () => {
    const roundCompetencies = [
      { name: 'Problem Solving' }, // default weight 1
    ];

    const ratings = [
      { name: 'Problem Solving', rating: 4 },
      { name: 'Extra Feedback', rating: 2 }, // default weight 1
    ];
    // (4*1 + 2*1) / 2 = 3.0

    const weighted = scorecardService.calculateWeightedScore(ratings, roundCompetencies);
    expect(weighted).toBe(3.0);
  });

  it('should return 0 if no ratings are provided', () => {
    const weighted = scorecardService.calculateWeightedScore([]);
    expect(weighted).toBe(0);
  });

  it('should handle case insensitivity and whitespace in competency names', () => {
    const roundCompetencies = [
      { name: '  System Design  ', weight: 3 },
    ];
    const ratings = [
      { name: 'system design', rating: 5 },
    ];

    const weighted = scorecardService.calculateWeightedScore(ratings, roundCompetencies);
    expect(weighted).toBe(5);
  });
});

describe('Debrief Consensus Determination Logic', () => {
  function computeConsensus(
    panelCount: number,
    votes: { YES?: number; STRONG_YES?: number; NO?: number; STRONG_NO?: number; MIXED?: number }
  ): string {
    const submittedCount = (votes.YES || 0) + (votes.STRONG_YES || 0) + (votes.NO || 0) + (votes.STRONG_NO || 0) + (votes.MIXED || 0);
    if (submittedCount < panelCount) {
      return 'PENDING_EVALUATIONS';
    }
    const hireVotes = (votes.YES || 0) + (votes.STRONG_YES || 0);
    const noHireVotes = (votes.NO || 0) + (votes.STRONG_NO || 0);
    const mixedVotes = votes.MIXED || 0;

    if (hireVotes > 0 && noHireVotes === 0 && mixedVotes === 0) {
      return 'CONSENSUS_HIRE';
    } else if (noHireVotes > 0 && hireVotes === 0 && mixedVotes === 0) {
      return 'CONSENSUS_NO_HIRE';
    }
    return 'DIVERGENT_DEBRIEF_REQUIRED';
  }

  it('should return PENDING_EVALUATIONS if not all panel members submitted', () => {
    const consensus = computeConsensus(3, { YES: 2 });
    expect(consensus).toBe('PENDING_EVALUATIONS');
  });

  it('should return CONSENSUS_HIRE when all votes are YES or STRONG_YES', () => {
    const consensus = computeConsensus(3, { YES: 2, STRONG_YES: 1 });
    expect(consensus).toBe('CONSENSUS_HIRE');
  });

  it('should return CONSENSUS_NO_HIRE when all votes are NO or STRONG_NO', () => {
    const consensus = computeConsensus(2, { NO: 1, STRONG_NO: 1 });
    expect(consensus).toBe('CONSENSUS_NO_HIRE');
  });

  it('should return DIVERGENT_DEBRIEF_REQUIRED when panel votes conflict or include MIXED', () => {
    const divergent = computeConsensus(2, { YES: 1, NO: 1 });
    expect(divergent).toBe('DIVERGENT_DEBRIEF_REQUIRED');

    const mixed = computeConsensus(2, { YES: 1, MIXED: 1 });
    expect(mixed).toBe('DIVERGENT_DEBRIEF_REQUIRED');
  });
});
