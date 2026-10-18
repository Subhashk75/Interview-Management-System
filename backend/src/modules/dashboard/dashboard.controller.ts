import { Response, NextFunction } from 'express';
import { Interview } from '../../models/Interview.js';
import { Candidate } from '../../models/Candidate.js';
import { Job } from '../../models/Job.js';
import { Scorecard } from '../../models/Scorecard.js';
import { User } from '../../models/User.js';
import { AuthRequest } from '../../middleware/auth.js';
import { sendSuccess } from '../../utils/response.js';

export async function getDashboardStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId;
    const now = new Date();

    const [
      totalCandidates,
      activeJobs,
      totalInterviews,
      upcomingInterviews,
      pendingScorecardsCount,
      interviewers,
    ] = await Promise.all([
      Candidate.countDocuments({ organizationId: orgId, isArchived: false }),
      Job.countDocuments({ organizationId: orgId, status: 'OPEN' }),
      Interview.countDocuments({ organizationId: orgId }),
      Interview.find({
        organizationId: orgId,
        status: { $in: ['SCHEDULED', 'CONFIRMED'] },
        startTime: { $gte: now },
      })
        .populate('candidateId', 'firstName lastName email currentCompany currentTitle')
        .populate('jobId', 'title department')
        .populate('roundId', 'name type durationMinutes')
        .populate('interviewers.userId', 'firstName lastName email avatarUrl')
        .sort({ startTime: 1 })
        .limit(10),
      Scorecard.countDocuments({ organizationId: orgId, status: 'DRAFT' }),
      User.find({ organizationId: orgId, role: { $in: ['INTERVIEWER', 'ADMIN', 'RECRUITER'] }, isActive: true }).select(
        'firstName lastName email title department weeklyCapacityHours dailyInterviewLimit'
      ),
    ]);

    // Status breakdown
    const statusCounts = await Interview.aggregate([
      { $match: { organizationId: orgId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const metrics = {
      totalCandidates,
      activeJobs,
      totalInterviews,
      pendingScorecardsCount,
      upcomingInterviews,
      statusBreakdown: statusCounts.reduce((acc: any, curr: any) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      interviewerCount: interviewers.length,
      interviewers,
    };

    sendSuccess(res, metrics, 'Dashboard stats fetched successfully');
  } catch (error) {
    next(error);
  }
}
