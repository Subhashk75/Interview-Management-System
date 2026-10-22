import { Response, NextFunction } from 'express';
import { Interview } from '../../models/Interview.js';
import { Candidate } from '../../models/Candidate.js';
import { Job } from '../../models/Job.js';
import { Scorecard } from '../../models/Scorecard.js';
import { User } from '../../models/User.js';
import { InterviewRound } from '../../models/InterviewRound.js';
import { AuthRequest } from '../../middleware/auth.js';
import { sendSuccess } from '../../utils/response.js';

export async function getDashboardStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId;
    const now = new Date();

    // 1. Fetch Open Roles with openings count and candidates applied
    const jobs = await Job.find({ organizationId: orgId, status: { $in: ['OPEN', 'PAUSED'] } })
      .populate('hiringManagerId', 'firstName lastName email title')
      .populate('recruiterId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const openRoles = await Promise.all(
      jobs.map(async (job) => {
        const [candidateCount, candidatesByStageRaw, interviewsScheduledCount, roundsCount] = await Promise.all([
          Candidate.countDocuments({ organizationId: orgId, appliedJobId: job._id, isArchived: false }),
          Candidate.aggregate([
            { $match: { organizationId: orgId, appliedJobId: job._id, isArchived: false } },
            { $group: { _id: '$stage', count: { $sum: 1 } } },
          ]),
          Interview.countDocuments({
            organizationId: orgId,
            jobId: job._id,
            status: { $in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
          }),
          InterviewRound.countDocuments({ jobId: job._id }),
        ]);

        const candidatesByStage = candidatesByStageRaw.reduce((acc: any, curr: any) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {});

        return {
          _id: job._id,
          title: job.title,
          department: job.department,
          location: job.location,
          employmentType: job.employmentType,
          status: job.status,
          openingsCount: job.openingsCount || 1,
          applicantCount: candidateCount,
          candidatesByStage,
          interviewsScheduled: interviewsScheduledCount,
          roundsCount,
          hiringManager: job.hiringManagerId
            ? {
                firstName: (job.hiringManagerId as any).firstName,
                lastName: (job.hiringManagerId as any).lastName,
                title: (job.hiringManagerId as any).title,
              }
            : undefined,
          recruiter: job.recruiterId
            ? {
                firstName: (job.recruiterId as any).firstName,
                lastName: (job.recruiterId as any).lastName,
              }
            : undefined,
        };
      })
    );

    const totalOpenings = openRoles.reduce((sum, r) => sum + (r.openingsCount || 1), 0);

    // 2. Fetch Candidates with Applied Role & Latest Interview Status
    const candidates = await Candidate.find({ organizationId: orgId, isArchived: false })
      .populate('appliedJobId', 'title department location')
      .sort({ createdAt: -1 })
      .limit(25);

    const candidatesWithRole = await Promise.all(
      candidates.map(async (c) => {
        const latestInterview = await Interview.findOne({ candidateId: c._id })
          .populate('roundId', 'name type')
          .sort({ startTime: -1 });

        let hasPendingScorecard = false;
        if (latestInterview) {
          const scorecards = await Scorecard.find({ interviewId: latestInterview._id });
          const submittedCount = scorecards.filter((s) => s.status === 'SUBMITTED').length;
          hasPendingScorecard = submittedCount < latestInterview.interviewers.length;
        }

        return {
          _id: c._id,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone,
          currentCompany: c.currentCompany,
          currentTitle: c.currentTitle,
          skills: c.skills,
          appliedJob: c.appliedJobId
            ? {
                _id: (c.appliedJobId as any)._id,
                title: (c.appliedJobId as any).title,
                department: (c.appliedJobId as any).department,
                location: (c.appliedJobId as any).location,
              }
            : undefined,
          stage: c.stage || 'INTERVIEWING',
          latestInterview: latestInterview
            ? {
                _id: latestInterview._id,
                roundName: (latestInterview.roundId as any)?.name || 'Interview',
                startTime: latestInterview.startTime,
                endTime: latestInterview.endTime,
                status: latestInterview.status,
                meetingUrl: latestInterview.meetingUrl,
              }
            : undefined,
          hasPendingScorecard,
          createdAt: c.createdAt,
        };
      })
    );

    // 3. Pending Feedback Interviews (Depending on Feedback)
    // Interviews that have concluded or are completed, but not all assigned panelists have submitted scorecards
    const recentOrPastInterviews = await Interview.find({
      organizationId: orgId,
      status: { $in: ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'IN_PROGRESS'] },
      startTime: { $lte: new Date(now.getTime() + 2 * 60 * 60 * 1000) }, // started or starting soon
    })
      .populate('candidateId', 'firstName lastName email currentTitle')
      .populate('jobId', 'title department')
      .populate('roundId', 'name type durationMinutes')
      .populate('interviewers.userId', 'firstName lastName email avatarUrl title')
      .sort({ endTime: -1 });

    const pendingFeedbackInterviews: any[] = [];

    for (const interview of recentOrPastInterviews) {
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

      const unsubmittedPanelists = panelistsStatus.filter((p) => !p.hasSubmitted);

      if (unsubmittedPanelists.length > 0) {
        const endTime = new Date(interview.endTime).getTime();
        const diffMs = now.getTime() - endTime;
        const elapsedHours = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
        const isOverdue = now.getTime() > endTime && elapsedHours >= 12;

        pendingFeedbackInterviews.push({
          _id: interview._id,
          interviewId: interview._id,
          candidate: interview.candidateId
            ? {
                _id: (interview.candidateId as any)._id,
                firstName: (interview.candidateId as any).firstName,
                lastName: (interview.candidateId as any).lastName,
                email: (interview.candidateId as any).email,
              }
            : { firstName: 'Candidate', lastName: '', email: '' },
          job: interview.jobId
            ? {
                _id: (interview.jobId as any)._id,
                title: (interview.jobId as any).title,
                department: (interview.jobId as any).department,
              }
            : { title: 'General Role', department: 'Engineering' },
          round: interview.roundId
            ? {
                _id: (interview.roundId as any)._id,
                name: (interview.roundId as any).name,
                type: (interview.roundId as any).type,
              }
            : { name: 'Interview Round', type: 'TECHNICAL' },
          startTime: interview.startTime,
          endTime: interview.endTime,
          meetingUrl: interview.meetingUrl,
          elapsedHours,
          isOverdue,
          panelists: panelistsStatus,
          pendingCount: unsubmittedPanelists.length,
          totalPanelists: interview.interviewers.length,
        });
      }
    }

    // 4. Overall Pipeline Funnel Stats
    const funnelAggregate = await Candidate.aggregate([
      { $match: { organizationId: orgId, isArchived: false } },
      { $group: { _id: '$stage', count: { $sum: 1 } } },
    ]);

    const funnelStats = {
      APPLIED: 0,
      SCREENING: 0,
      INTERVIEWING: 0,
      OFFER: 0,
      HIRED: 0,
      REJECTED: 0,
    };
    funnelAggregate.forEach((f) => {
      if (f._id && (funnelStats as any)[f._id] !== undefined) {
        (funnelStats as any)[f._id] = f.count;
      }
    });

    // 5. Total Counts & Interview Status
    const [totalCandidates, totalInterviews, statusCounts, interviewers] = await Promise.all([
      Candidate.countDocuments({ organizationId: orgId, isArchived: false }),
      Interview.countDocuments({ organizationId: orgId }),
      Interview.aggregate([
        { $match: { organizationId: orgId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      User.find({ organizationId: orgId, role: { $in: ['INTERVIEWER', 'ADMIN', 'RECRUITER'] }, isActive: true }).select(
        'firstName lastName email title department weeklyCapacityHours dailyInterviewLimit avatarUrl'
      ),
    ]);

    // 6. Upcoming Interviews
    const upcomingInterviews = await Interview.find({
      organizationId: orgId,
      status: { $in: ['SCHEDULED', 'CONFIRMED'] },
      startTime: { $gte: now },
    })
      .populate('candidateId', 'firstName lastName email currentCompany currentTitle')
      .populate('jobId', 'title department')
      .populate('roundId', 'name type durationMinutes')
      .populate('interviewers.userId', 'firstName lastName email avatarUrl')
      .sort({ startTime: 1 })
      .limit(6);

    const metrics = {
      totalCandidates,
      activeJobs: jobs.length,
      totalOpenings,
      totalInterviews,
      pendingScorecardsCount: pendingFeedbackInterviews.length,
      openRoles,
      candidatesWithRole,
      pendingFeedbackInterviews: pendingFeedbackInterviews.slice(0, 10),
      funnelStats,
      upcomingInterviews,
      statusBreakdown: statusCounts.reduce((acc: any, curr: any) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      interviewerCount: interviewers.length,
      interviewers,
    };

    sendSuccess(res, metrics, 'Redesigned dashboard statistics fetched successfully');
  } catch (error) {
    next(error);
  }
}
