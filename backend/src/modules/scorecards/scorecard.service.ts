import mongoose from 'mongoose';
import { Scorecard, IScorecard, OverallRecommendation } from '../../models/Scorecard.js';
import { Interview } from '../../models/Interview.js';
import { InterviewRound } from '../../models/InterviewRound.js';
import { AuditLog } from '../../models/AuditLog.js';
import { AppError } from '../../utils/appError.js';
import { logger } from '../../utils/logger.js';

export interface SubmitScorecardDto {
  organizationId: string;
  interviewId: string;
  interviewerId: string;
  userRole?: string;
  ratings: { name: string; rating: number; notes?: string }[];
  overallRecommendation: OverallRecommendation;
  summaryFeedback: string;
  status: 'DRAFT' | 'SUBMITTED';
}

export class ScorecardService {
  /**
   * Calculates the weighted average score across ratings using weights from the round template.
   */
  calculateWeightedScore(
    ratings: { name: string; rating: number }[],
    competencies: { name: string; weight: number }[]
  ): number {
    if (!ratings || ratings.length === 0) return 0;

    const weightMap = new Map<string, number>();
    competencies.forEach((c) => weightMap.set(c.name.toLowerCase().trim(), c.weight || 1));

    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const r of ratings) {
      const weight = weightMap.get(r.name.toLowerCase().trim()) || 1;
      totalWeightedScore += r.rating * weight;
      totalWeight += weight;
    }

    if (totalWeight === 0) return 0;
    return Math.round((totalWeightedScore / totalWeight) * 100) / 100;
  }

  /**
   * Submits or updates an evaluation scorecard with validation, anti-tampering guards, and auto-completion.
   */
  async upsertScorecard(dto: SubmitScorecardDto): Promise<IScorecard> {
    const interview = await Interview.findById(dto.interviewId);
    if (!interview) {
      throw new AppError('Interview not found.', 404, 'NOT_FOUND');
    }

    // Guard 1: Cannot submit scorecard for cancelled interview
    if (interview.status === 'CANCELLED') {
      throw new AppError('Cannot submit evaluation for a cancelled interview.', 400, 'INTERVIEW_CANCELLED');
    }

    // Guard 2: Verify assigned interviewer (or Admin/Recruiter governance role)
    const isAssigned = interview.interviewers.some(
      (inv) => inv.userId.toString() === dto.interviewerId
    );
    const hasPrivilege = ['ADMIN', 'RECRUITER'].includes(dto.userRole || '');
    if (!isAssigned && !hasPrivilege) {
      throw new AppError('You are not assigned as an interviewer for this session.', 403, 'NOT_ASSIGNED');
    }

    // Load Round competencies to validate completeness and compute weighted score
    const round = await InterviewRound.findById(interview.roundId);
    const roundCompetencies = round?.competencies || [];

    // Guard 3: Validate rating ranges
    for (const r of dto.ratings || []) {
      if (typeof r.rating !== 'number' || r.rating < 1 || r.rating > 5) {
        throw new AppError(`Rating for ${r.name} must be a number between 1 and 5.`, 400, 'INVALID_RATING');
      }
    }

    // Guard 4: Completeness check on final submission
    if (dto.status === 'SUBMITTED' && roundCompetencies.length > 0) {
      const ratedNames = new Set((dto.ratings || []).map((r) => r.name.toLowerCase().trim()));
      const missing = roundCompetencies.filter((c) => !ratedNames.has(c.name.toLowerCase().trim()));
      if (missing.length > 0) {
        throw new AppError(
          `Please provide ratings for all required competencies: ${missing.map((m) => m.name).join(', ')}`,
          400,
          'INCOMPLETE_EVALUATION'
        );
      }
    }

    // Compute weighted score
    const weightedScore = this.calculateWeightedScore(dto.ratings || [], roundCompetencies);

    let scorecard = await Scorecard.findOne({
      interviewId: dto.interviewId,
      interviewerId: dto.interviewerId,
    });

    // Guard 5: Submission Lock
    if (scorecard && scorecard.status === 'SUBMITTED' && !scorecard.isUnlocked) {
      throw new AppError(
        'Scorecard has already been submitted and is locked for evaluation integrity.',
        400,
        'SCORECARD_LOCKED'
      );
    }

    if (!scorecard) {
      scorecard = new Scorecard({
        organizationId: dto.organizationId,
        interviewId: dto.interviewId,
        candidateId: interview.candidateId,
        interviewerId: dto.interviewerId,
        ratings: dto.ratings,
        overallRecommendation: dto.overallRecommendation,
        summaryFeedback: dto.summaryFeedback,
        status: dto.status,
        weightedScore,
        isUnlocked: false,
        submittedAt: dto.status === 'SUBMITTED' ? new Date() : undefined,
      });
    } else {
      scorecard.ratings = dto.ratings;
      scorecard.overallRecommendation = dto.overallRecommendation;
      scorecard.summaryFeedback = dto.summaryFeedback;
      scorecard.status = dto.status;
      scorecard.weightedScore = weightedScore;
      scorecard.isUnlocked = false; // Relocked upon submission
      if (dto.status === 'SUBMITTED') {
        scorecard.submittedAt = new Date();
      }
    }

    await scorecard.save();

    // Check if all assigned interviewers have submitted
    if (dto.status === 'SUBMITTED') {
      const allScorecards = await Scorecard.find({
        interviewId: dto.interviewId,
        status: 'SUBMITTED',
      });

      if (allScorecards.length >= interview.interviewers.length) {
        interview.status = 'COMPLETED';
        await interview.save();
        logger.info(`All scorecards submitted for interview ${interview._id}. Marked as COMPLETED.`);
      }

      // Record audit log entry
      try {
        await AuditLog.create({
          organizationId: dto.organizationId,
          userId: dto.interviewerId,
          action: 'EVALUATION_SUBMITTED',
          entityType: 'Scorecard',
          entityId: scorecard._id.toString(),
          details: {
            interviewId: dto.interviewId,
            overallRecommendation: dto.overallRecommendation,
            weightedScore,
          },
        });
      } catch (logErr) {
        logger.warn('Failed to record evaluation audit log:', logErr);
      }
    }

    return scorecard;
  }

  /**
   * Retrieves scorecards for an interview with ANTI-BIAS BLINDING enforcement.
   */
  async getBlindedScorecardsForInterview(
    interviewId: string,
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<{ scorecards: any[]; isBlinded: boolean }> {
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found.', 404, 'NOT_FOUND');
    }

    const allScorecards = await Scorecard.find({ interviewId })
      .populate('interviewerId', 'firstName lastName email title avatarUrl')
      .lean();

    const isAdminOrRecruiter = ['ADMIN', 'RECRUITER'].includes(requestingUserRole);

    // Find the requesting user's scorecard
    const myScorecard = allScorecards.find(
      (s) => s.interviewerId && (s.interviewerId as any)._id?.toString() === requestingUserId
    );

    const hasSubmittedMyScorecard = myScorecard?.status === 'SUBMITTED';

    // If Admin/Recruiter or interviewer has submitted their own scorecard, unblind all
    if (isAdminOrRecruiter || hasSubmittedMyScorecard) {
      return { scorecards: allScorecards, isBlinded: false };
    }

    // Otherwise, blind/redact all peer scorecards!
    const blindedScorecards = allScorecards.map((s) => {
      const isMine = (s.interviewerId as any)?._id?.toString() === requestingUserId;
      if (isMine) return s;

      return {
        _id: s._id,
        interviewerId: {
          _id: (s.interviewerId as any)?._id,
          firstName: (s.interviewerId as any)?.firstName,
          lastName: (s.interviewerId as any)?.lastName,
          title: (s.interviewerId as any)?.title,
          avatarUrl: (s.interviewerId as any)?.avatarUrl,
        },
        status: s.status,
        isBlinded: true,
        message: 'Feedback hidden until you submit your own scorecard (Anti-Bias Policy).',
      };
    });

    return { scorecards: blindedScorecards, isBlinded: true };
  }

  /**
   * Administrative Unlock: Allows an Admin/Recruiter to unlock a locked scorecard for edits.
   */
  async unlockScorecard(
    scorecardId: string,
    unlockedByUserId: string,
    reason: string,
    organizationId: string
  ): Promise<IScorecard> {
    if (!reason || reason.trim().length === 0) {
      throw new AppError('An unlock reason is required for governance tracking.', 400, 'MISSING_REASON');
    }

    const scorecard = await Scorecard.findOne({ _id: scorecardId, organizationId });
    if (!scorecard) {
      throw new AppError('Scorecard not found.', 404, 'NOT_FOUND');
    }

    scorecard.status = 'DRAFT';
    scorecard.isUnlocked = true;
    scorecard.unlockedBy = new mongoose.Types.ObjectId(unlockedByUserId);
    scorecard.unlockReason = reason;
    await scorecard.save();

    // Revert interview completion status if necessary
    const interview = await Interview.findById(scorecard.interviewId);
    if (interview && interview.status === 'COMPLETED') {
      interview.status = 'IN_PROGRESS';
      await interview.save();
    }

    // Audit log
    await AuditLog.create({
      organizationId,
      userId: unlockedByUserId,
      action: 'SCORECARD_UNLOCKED',
      entityType: 'Scorecard',
      entityId: scorecard._id.toString(),
      details: {
        reason,
        interviewId: scorecard.interviewId.toString(),
      },
    });

    logger.info(`Scorecard ${scorecard._id} unlocked by user ${unlockedByUserId} with reason: ${reason}`);
    return scorecard;
  }

  /**
   * Compiles the Consolidated Debrief Packet for hiring managers and calibration debriefs.
   */
  async getDebriefPacket(interviewId: string): Promise<any> {
    const interview = await Interview.findById(interviewId)
      .populate('candidateId', 'firstName lastName email currentCompany currentTitle resumeUrl stage')
      .populate('jobId', 'title department location openingsCount')
      .populate('roundId', 'name order type durationMinutes competencies')
      .populate('interviewers.userId', 'firstName lastName email title avatarUrl');

    if (!interview) {
      throw new AppError('Interview not found.', 404, 'NOT_FOUND');
    }

    const scorecards = await Scorecard.find({ interviewId })
      .populate('interviewerId', 'firstName lastName email title avatarUrl')
      .lean();

    // Recommendation Breakdown
    const recommendationsCount: { [key: string]: number } = {
      STRONG_NO: 0,
      NO: 0,
      MIXED: 0,
      YES: 0,
      STRONG_YES: 0,
    };

    let totalWeightedScoreSum = 0;
    let submittedCount = 0;

    scorecards.forEach((s) => {
      if (s.overallRecommendation && recommendationsCount[s.overallRecommendation] !== undefined) {
        recommendationsCount[s.overallRecommendation]++;
      }
      if (s.status === 'SUBMITTED') {
        submittedCount++;
        totalWeightedScoreSum += s.weightedScore || 0;
      }
    });

    const averageWeightedScore = submittedCount > 0 ? Math.round((totalWeightedScoreSum / submittedCount) * 100) / 100 : 0;

    // Consensus Assessment
    let consensusStatus = 'PENDING_EVALUATIONS';
    if (submittedCount > 0 && submittedCount >= interview.interviewers.length) {
      const hireVotes = recommendationsCount.YES + recommendationsCount.STRONG_YES;
      const noHireVotes = recommendationsCount.NO + recommendationsCount.STRONG_NO;
      if (hireVotes > 0 && noHireVotes === 0 && recommendationsCount.MIXED === 0) {
        consensusStatus = 'CONSENSUS_HIRE';
      } else if (noHireVotes > 0 && hireVotes === 0 && recommendationsCount.MIXED === 0) {
        consensusStatus = 'CONSENSUS_NO_HIRE';
      } else {
        consensusStatus = 'DIVERGENT_DEBRIEF_REQUIRED';
      }
    }

    return {
      interview,
      scorecards,
      metrics: {
        totalAssignedPanelists: interview.interviewers.length,
        submittedCount,
        averageWeightedScore,
        recommendationsCount,
        consensusStatus,
      },
    };
  }
}

export const scorecardService = new ScorecardService();
