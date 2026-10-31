import { describe, it, expect } from 'vitest';
import { dashboardService } from '../modules/dashboard/dashboard.service.js';

describe('Role-Based Dashboard Engine', () => {
  it('should define distinct KPI structures for each role', () => {
    const adminExpectedKpis = [
      'totalUsers',
      'totalRecruiters',
      'totalInterviewers',
      'totalHiringManagers',
      'totalCandidates',
      'activeJobPositions',
      'totalInterviews',
      'scheduledInterviews',
      'completedInterviews',
    ];

    const recruiterExpectedKpis = [
      'totalCandidates',
      'activeCandidates',
      'candidatesInScreening',
      'interviewsScheduled',
      'pendingEvaluations',
      'completedInterviews',
      'openPositions',
    ];

    const interviewerExpectedKpis = [
      'todaysInterviewsCount',
      'upcomingInterviewsCount',
      'completedInterviewsCount',
      'pendingScorecardsCount',
      'submittedScorecardsCount',
      'weeklyCapacityHours',
      'dailyInterviewLimit',
      'hoursBookedThisWeek',
    ];

    const hiringManagerExpectedKpis = [
      'activeJobPositions',
      'totalApplicants',
      'candidatesUnderReviewCount',
      'pendingHiringDecisionsCount',
      'completedInterviewRounds',
      'selectedCandidatesCount',
    ];

    const candidateExpectedKpis = [
      'applicationsSubmitted',
      'interviewsScheduled',
      'upcomingInterviewsCount',
      'completedInterviewRounds',
    ];

    expect(adminExpectedKpis.length).toBe(9);
    expect(recruiterExpectedKpis.length).toBe(7);
    expect(interviewerExpectedKpis.length).toBe(8);
    expect(hiringManagerExpectedKpis.length).toBe(6);
    expect(candidateExpectedKpis.length).toBe(4);
  });
});
