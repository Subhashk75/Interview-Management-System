import { Scorecard, IScorecard, OverallRecommendation } from '../../models/Scorecard.js';
import { Interview } from '../../models/Interview.js';
import { AppError } from '../../utils/appError.js';
import { logger } from '../../utils/logger.js';

export interface SubmitScorecardDto {
  organizationId: string;
  interviewId: string;
  interviewerId: string;
  ratings: { name: string; rating: number; notes?: string }[];
  overallRecommendation: OverallRecommendation;
  summaryFeedback: string;
  status: 'DRAFT' | 'SUBMITTED';
}

export class ScorecardService {
  /**
   * Submits or updates an evaluation scorecard.
   */
  async upsertScorecard(dto: SubmitScorecardDto): Promise<IScorecard> {
    const interview = await Interview.findById(dto.interviewId);
    if (!interview) {
      throw new AppError('Interview not found.', 404, 'NOT_FOUND');
    }

    let scorecard = await Scorecard.findOne({
      interviewId: dto.interviewId,
      interviewerId: dto.interviewerId,
    });

    if (scorecard && scorecard.status === 'SUBMITTED') {
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
        submittedAt: dto.status === 'SUBMITTED' ? new Date() : undefined,
      });
    } else {
      scorecard.ratings = dto.ratings;
      scorecard.overallRecommendation = dto.overallRecommendation;
      scorecard.summaryFeedback = dto.summaryFeedback;
      scorecard.status = dto.status;
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
    }

    return scorecard;
  }

  /**
   * Retrieves scorecards for an interview with ANTI-BIAS BLINDING enforcement.
   * If requesting user is an interviewer who has NOT submitted their own scorecard,
   * peer scorecards are blinded (redacted) to prevent conformity bias.
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
      .populate('interviewerId', 'firstName lastName email title')
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
        },
        status: s.status,
        isBlinded: true,
        message: 'Feedback hidden until you submit your own scorecard (Anti-Bias Policy).',
      };
    });

    return { scorecards: blindedScorecards, isBlinded: true };
  }
}

export const scorecardService = new ScorecardService();
