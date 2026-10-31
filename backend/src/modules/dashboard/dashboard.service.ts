import { Interview } from '../../models/Interview.js';
import { Candidate } from '../../models/Candidate.js';
import { Job } from '../../models/Job.js';
import { Scorecard } from '../../models/Scorecard.js';
import { User } from '../../models/User.js';
import { AuditLog } from '../../models/AuditLog.js';
import { InterviewRound } from '../../models/InterviewRound.js';
import { profileService } from '../profile/profile.service.js';

export class DashboardService {
  /**
   * ADMIN DASHBOARD
   * Platform-wide operational overview, user distribution, recruitment analytics, audit trail.
   */
  async getAdminDashboard(organizationId: string) {
    const now = new Date();

    const [
      totalUsers,
      recruitersCount,
      interviewersCount,
      hiringManagersCount,
      candidatesCount,
      activeJobsCount,
      totalInterviews,
      scheduledInterviews,
      completedInterviews,
      userList,
      interviewStatusRaw,
      candidateStagesRaw,
      recentAuditLogs,
    ] = await Promise.all([
      User.countDocuments({ organizationId }),
      User.countDocuments({ organizationId, role: 'RECRUITER' }),
      User.countDocuments({ organizationId, role: 'INTERVIEWER' }),
      User.countDocuments({ organizationId, role: 'HIRING_MANAGER' }),
      Candidate.countDocuments({ organizationId, isArchived: false }),
      Job.countDocuments({ organizationId, status: 'OPEN' }),
      Interview.countDocuments({ organizationId }),
      Interview.countDocuments({ organizationId, status: { $in: ['SCHEDULED', 'CONFIRMED'] } }),
      Interview.countDocuments({ organizationId, status: 'COMPLETED' }),
      User.find({ organizationId })
        .select('firstName lastName email role title department isActive isVerified avatarUrl createdAt')
        .sort({ createdAt: -1 })
        .limit(10),
      Interview.aggregate([
        { $match: { organizationId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Candidate.aggregate([
        { $match: { organizationId, isArchived: false } },
        { $group: { _id: '$stage', count: { $sum: 1 } } },
      ]),
      AuditLog.find({ organizationId })
        .populate('userId', 'firstName lastName email role')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    const interviewStatus = interviewStatusRaw.reduce((acc: any, curr: any) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const candidateStages = candidateStagesRaw.reduce((acc: any, curr: any) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    return {
      role: 'ADMIN',
      kpis: {
        totalUsers,
        totalRecruiters: recruitersCount,
        totalInterviewers: interviewersCount,
        totalHiringManagers: hiringManagersCount,
        totalCandidates: candidatesCount,
        activeJobPositions: activeJobsCount,
        totalInterviews,
        scheduledInterviews,
        completedInterviews,
      },
      userDistribution: {
        ADMIN: totalUsers - (recruitersCount + interviewersCount + hiringManagersCount),
        RECRUITER: recruitersCount,
        INTERVIEWER: interviewersCount,
        HIRING_MANAGER: hiringManagersCount,
      },
      userList,
      recruitmentAnalytics: {
        interviewStatus,
        candidateStages,
      },
      recentAuditLogs,
    };
  }

  /**
   * RECRUITER DASHBOARD
   * Sourcing pipeline, candidate funnel, pending evaluations with reminder nudges, upcoming interviews.
   */
  async getRecruiterDashboard(organizationId: string) {
    const now = new Date();

    const [
      totalCandidates,
      activeCandidates,
      screeningCandidates,
      scheduledInterviews,
      completedInterviews,
      jobs,
      funnelAggregate,
      upcomingInterviews,
      recentCandidates,
      allPendingInterviews,
    ] = await Promise.all([
      Candidate.countDocuments({ organizationId, isArchived: false }),
      Candidate.countDocuments({ organizationId, stage: { $nin: ['REJECTED', 'HIRED'] }, isArchived: false }),
      Candidate.countDocuments({ organizationId, stage: 'SCREENING', isArchived: false }),
      Interview.countDocuments({ organizationId, status: { $in: ['SCHEDULED', 'CONFIRMED'] } }),
      Interview.countDocuments({ organizationId, status: 'COMPLETED' }),
      Job.find({ organizationId, status: { $in: ['OPEN', 'PAUSED'] } })
        .populate('hiringManagerId', 'firstName lastName title')
        .sort({ createdAt: -1 }),
      Candidate.aggregate([
        { $match: { organizationId, isArchived: false } },
        { $group: { _id: '$stage', count: { $sum: 1 } } },
      ]),
      Interview.find({
        organizationId,
        status: { $in: ['SCHEDULED', 'CONFIRMED'] },
        startTime: { $gte: now },
      })
        .populate('candidateId', 'firstName lastName email currentCompany currentTitle')
        .populate('jobId', 'title department')
        .populate('roundId', 'name type durationMinutes')
        .populate('interviewers.userId', 'firstName lastName email avatarUrl title')
        .sort({ startTime: 1 })
        .limit(6),
      Candidate.find({ organizationId, isArchived: false })
        .populate('appliedJobId', 'title department')
        .sort({ createdAt: -1 })
        .limit(8),
      Interview.find({
        organizationId,
        status: { $in: ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'IN_PROGRESS'] },
      })
        .populate('candidateId', 'firstName lastName email')
        .populate('jobId', 'title department')
        .populate('roundId', 'name')
        .populate('interviewers.userId', 'firstName lastName email avatarUrl title')
        .sort({ endTime: -1 }),
    ]);

    const funnelStats: { [key: string]: number } = {
      APPLIED: 0,
      SCREENING: 0,
      INTERVIEWING: 0,
      OFFER: 0,
      HIRED: 0,
      REJECTED: 0,
    };
    funnelAggregate.forEach((f) => {
      if (f._id && funnelStats[f._id] !== undefined) {
        funnelStats[f._id] = f.count;
      }
    });

    // Check interviews with pending scorecards
    const pendingFeedbackNudges: any[] = [];
    for (const interview of allPendingInterviews) {
      const scorecards = await Scorecard.find({ interviewId: interview._id });
      const scorecardMap = new Map();
      scorecards.forEach((s) => scorecardMap.set(s.interviewerId.toString(), s.status));

      const panelistsStatus = interview.interviewers.map((inv) => {
        const u = inv.userId as any;
        const status = scorecardMap.get(u?._id?.toString()) || 'NOT_STARTED';
        return {
          userId: u?._id,
          name: `${u?.firstName || ''} ${u?.lastName || ''}`.trim(),
          avatarUrl: u?.avatarUrl,
          title: u?.title,
          hasSubmitted: status === 'SUBMITTED',
          scorecardStatus: status,
        };
      });

      const unsubmitted = panelistsStatus.filter((p) => !p.hasSubmitted);
      if (unsubmitted.length > 0) {
        const endTime = new Date(interview.endTime).getTime();
        const diffMs = now.getTime() - endTime;
        const elapsedHours = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
        const isOverdue = now.getTime() > endTime && elapsedHours >= 12;

        pendingFeedbackNudges.push({
          _id: interview._id,
          candidate: interview.candidateId,
          job: interview.jobId,
          round: interview.roundId,
          startTime: interview.startTime,
          endTime: interview.endTime,
          elapsedHours,
          isOverdue,
          pendingPanelists: unsubmitted,
          totalPanelists: interview.interviewers.length,
        });
      }
    }

    const openPositions = jobs.map((job) => ({
      _id: job._id,
      title: job.title,
      department: job.department,
      location: job.location,
      openingsCount: job.openingsCount || 1,
      status: job.status,
      hiringManager: job.hiringManagerId,
    }));

    return {
      role: 'RECRUITER',
      kpis: {
        totalCandidates,
        activeCandidates,
        candidatesInScreening: screeningCandidates,
        interviewsScheduled: scheduledInterviews,
        pendingEvaluations: pendingFeedbackNudges.length,
        completedInterviews,
        openPositions: jobs.length,
      },
      funnelStats,
      upcomingInterviews,
      pendingFeedbackNudges: pendingFeedbackNudges.slice(0, 10),
      openPositions,
      recentCandidates,
    };
  }

  /**
   * INTERVIEWER DASHBOARD
   * Panelist focus: Assigned interviews, prep kit, pending scorecards, weekly capacity and quota limits.
   */
  async getInterviewerDashboard(organizationId: string, userId: string) {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    // Monday of current week
    const currentDay = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const user = await User.findById(userId);
    const weeklyCapacityHours = user?.weeklyCapacityHours || 5;
    const dailyInterviewLimit = user?.dailyInterviewLimit || 2;

    // All interviews assigned to this panelist
    const [
      todaysInterviews,
      upcomingInterviews,
      completedInterviews,
      weekInterviews,
      myScorecards,
      allAssignedInterviews,
    ] = await Promise.all([
      Interview.find({
        organizationId,
        'interviewers.userId': userId,
        startTime: { $gte: startOfToday, $lte: endOfToday },
        status: { $in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
      })
        .populate('candidateId', 'firstName lastName email currentCompany currentTitle skills resumeUrl')
        .populate('jobId', 'title department')
        .populate('roundId', 'name type durationMinutes competencies')
        .sort({ startTime: 1 }),

      Interview.find({
        organizationId,
        'interviewers.userId': userId,
        startTime: { $gt: now },
        status: { $in: ['SCHEDULED', 'CONFIRMED'] },
      })
        .populate('candidateId', 'firstName lastName email currentCompany currentTitle skills resumeUrl')
        .populate('jobId', 'title department')
        .populate('roundId', 'name type durationMinutes competencies')
        .sort({ startTime: 1 })
        .limit(10),

      Interview.find({
        organizationId,
        'interviewers.userId': userId,
        status: 'COMPLETED',
      }),

      Interview.find({
        organizationId,
        'interviewers.userId': userId,
        startTime: { $gte: monday, $lte: sunday },
        status: { $nin: ['CANCELLED'] },
      }),

      Scorecard.find({ interviewerId: userId }),

      Interview.find({
        organizationId,
        'interviewers.userId': userId,
        status: { $in: ['COMPLETED', 'IN_PROGRESS', 'SCHEDULED', 'CONFIRMED'] },
      })
        .populate('candidateId', 'firstName lastName email currentCompany currentTitle skills resumeUrl')
        .populate('jobId', 'title department')
        .populate('roundId', 'name type competencies')
        .sort({ endTime: -1 }),
    ]);

    // Calculate weekly hours booked
    const hoursBookedThisWeek = weekInterviews.reduce((acc, inv) => {
      const dur = (new Date(inv.endTime).getTime() - new Date(inv.startTime).getTime()) / (1000 * 60 * 60);
      return acc + dur;
    }, 0);

    // Identify interviews awaiting this panelist's scorecard
    const mySubmittedScorecardMap = new Map();
    myScorecards.forEach((sc) => mySubmittedScorecardMap.set(sc.interviewId.toString(), sc));

    const pendingScorecards: any[] = [];
    for (const inv of allAssignedInterviews) {
      const isPastOrCompleted = new Date(inv.endTime) <= now || inv.status === 'COMPLETED';
      const myCard = mySubmittedScorecardMap.get(inv._id.toString());
      if (isPastOrCompleted && (!myCard || myCard.status === 'DRAFT' || myCard.isUnlocked)) {
        pendingScorecards.push({
          interview: inv,
          existingDraft: myCard || null,
        });
      }
    }

    return {
      role: 'INTERVIEWER',
      kpis: {
        todaysInterviewsCount: todaysInterviews.length,
        upcomingInterviewsCount: upcomingInterviews.length,
        completedInterviewsCount: completedInterviews.length,
        pendingScorecardsCount: pendingScorecards.length,
        submittedScorecardsCount: myScorecards.filter((s) => s.status === 'SUBMITTED').length,
        weeklyCapacityHours,
        dailyInterviewLimit,
        hoursBookedThisWeek: Math.round(hoursBookedThisWeek * 10) / 10,
      },
      todaysInterviews,
      upcomingInterviews,
      pendingScorecards,
      recentScorecards: myScorecards.slice(0, 5),
    };
  }

  /**
   * HIRING MANAGER DASHBOARD
   * Positions managed, candidates under review, consolidated debrief consensus, decision funnel.
   */
  async getHiringManagerDashboard(organizationId: string, userId: string) {
    const now = new Date();

    // Find jobs where user is designated hiring manager, or jobs in user's department
    const user = await User.findById(userId);
    let managerJobs = await Job.find({
      organizationId,
      $or: [{ hiringManagerId: userId }, { department: user?.department || 'Product Engineering' }],
    }).sort({ createdAt: -1 });

    if (managerJobs.length === 0) {
      managerJobs = await Job.find({ organizationId }).limit(3);
    }

    const jobIds = managerJobs.map((j) => j._id);

    const [candidatesUnderReview, interviewsForRoles, totalApplicants] = await Promise.all([
      Candidate.find({ organizationId, appliedJobId: { $in: jobIds }, isArchived: false })
        .populate('appliedJobId', 'title department location')
        .sort({ updatedAt: -1 })
        .limit(15),

      Interview.find({ organizationId, jobId: { $in: jobIds } })
        .populate('candidateId', 'firstName lastName email currentCompany currentTitle')
        .populate('jobId', 'title department')
        .populate('roundId', 'name type durationMinutes')
        .populate('interviewers.userId', 'firstName lastName title avatarUrl')
        .sort({ startTime: -1 })
        .limit(15),

      Candidate.countDocuments({ organizationId, appliedJobId: { $in: jobIds }, isArchived: false }),
    ]);

    // Candidates in final decision stages
    const pendingHiringDecisions = candidatesUnderReview.filter(
      (c) => c.stage === 'OFFER' || c.stage === 'INTERVIEWING'
    );
    const selectedCandidates = candidatesUnderReview.filter((c) => c.stage === 'HIRED');

    // Debriefs ready for review (completed interviews with scorecards)
    const completedInterviews = interviewsForRoles.filter((i) => i.status === 'COMPLETED');
    const debriefSummaries: any[] = [];

    for (const inv of completedInterviews.slice(0, 6)) {
      const cards = await Scorecard.find({ interviewId: inv._id });
      let positiveVotes = 0;
      let negativeVotes = 0;
      let totalWeighted = 0;

      cards.forEach((sc) => {
        if (sc.overallRecommendation === 'YES' || sc.overallRecommendation === 'STRONG_YES') positiveVotes++;
        if (sc.overallRecommendation === 'NO' || sc.overallRecommendation === 'STRONG_NO') negativeVotes++;
        totalWeighted += sc.weightedScore || 0;
      });

      const avgWeighted = cards.length > 0 ? Math.round((totalWeighted / cards.length) * 100) / 100 : 0;
      let consensus = 'PENDING';
      if (cards.length >= inv.interviewers.length) {
        if (positiveVotes > 0 && negativeVotes === 0) consensus = 'CONSENSUS_HIRE';
        else if (negativeVotes > 0 && positiveVotes === 0) consensus = 'CONSENSUS_NO_HIRE';
        else consensus = 'DIVERGENT_DEBRIEF';
      }

      debriefSummaries.push({
        interview: inv,
        submittedCount: cards.length,
        totalPanelists: inv.interviewers.length,
        averageScore: avgWeighted,
        consensus,
      });
    }

    return {
      role: 'HIRING_MANAGER',
      kpis: {
        activeJobPositions: managerJobs.length,
        totalApplicants,
        candidatesUnderReviewCount: candidatesUnderReview.length,
        pendingHiringDecisionsCount: pendingHiringDecisions.length,
        completedInterviewRounds: completedInterviews.length,
        selectedCandidatesCount: selectedCandidates.length,
      },
      managerJobs,
      candidatesUnderReview,
      debriefSummaries,
      upcomingInterviews: interviewsForRoles.filter((i) => new Date(i.startTime) > now).slice(0, 5),
    };
  }

  /**
   * CANDIDATE DASHBOARD
   * Individual candidate view: applications, upcoming interviews with direct meeting link, no internal feedback exposure.
   */
  async getCandidateDashboard(organizationId: string, userEmail: string) {
    const now = new Date();

    // Locate candidate record matching email
    const candidate = await Candidate.findOne({
      email: userEmail.toLowerCase(),
      isArchived: false,
    }).populate('appliedJobId', 'title department location description openingsCount');

    let applications: any[] = [];
    let upcomingInterviews: any[] = [];
    let completedInterviews: any[] = [];

    if (candidate) {
      applications = [
        {
          job: candidate.appliedJobId,
          stage: candidate.stage,
          appliedDate: candidate.createdAt,
          location: (candidate.appliedJobId as any)?.location || 'Remote',
        },
      ];

      const interviews = await Interview.find({ candidateId: candidate._id })
        .populate('roundId', 'name type durationMinutes')
        .sort({ startTime: 1 });

      upcomingInterviews = interviews
        .filter((i) => new Date(i.startTime) >= now && i.status !== 'CANCELLED')
        .map((i) => ({
          _id: i._id,
          roundName: (i.roundId as any)?.name || 'Interview Round',
          roundType: (i.roundId as any)?.type || 'TECHNICAL',
          startTime: i.startTime,
          endTime: i.endTime,
          meetingUrl: i.meetingUrl,
          durationMinutes: (i.roundId as any)?.durationMinutes || 60,
          status: i.status,
        }));

      completedInterviews = interviews
        .filter((i) => new Date(i.endTime) < now || i.status === 'COMPLETED')
        .map((i) => ({
          _id: i._id,
          roundName: (i.roundId as any)?.name || 'Interview Round',
          startTime: i.startTime,
          status: i.status,
        }));
    }

    return {
      role: 'CANDIDATE',
      kpis: {
        applicationsSubmitted: applications.length,
        interviewsScheduled: upcomingInterviews.length,
        upcomingInterviewsCount: upcomingInterviews.length,
        completedInterviewRounds: completedInterviews.length,
      },
      candidate,
      applications,
      upcomingInterviews,
      completedInterviews,
    };
  }
}

export const dashboardService = new DashboardService();
