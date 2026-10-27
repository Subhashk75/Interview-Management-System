import { Response, NextFunction } from 'express';
import { scorecardService } from './scorecard.service.js';
import { AuthRequest } from '../../middleware/auth.js';
import { sendSuccess } from '../../utils/response.js';

export async function submitScorecard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { interviewId, ratings, overallRecommendation, summaryFeedback, status } = req.body;
    const scorecard = await scorecardService.upsertScorecard({
      organizationId: req.organizationId!,
      interviewId,
      interviewerId: req.userId!,
      ratings,
      overallRecommendation,
      summaryFeedback,
      status: status || 'SUBMITTED',
    });

    sendSuccess(res, scorecard, 'Scorecard submitted successfully', 200);
  } catch (error) {
    next(error);
  }
}

export async function getInterviewScorecards(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await scorecardService.getBlindedScorecardsForInterview(
      req.params.interviewId,
      req.userId!,
      req.userRole!
    );

    sendSuccess(res, result, 'Scorecards retrieved');
  } catch (error) {
    next(error);
  }
}

export async function unlockScorecard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { reason } = req.body;
    const scorecard = await scorecardService.unlockScorecard(
      req.params.id,
      req.userId!,
      reason,
      req.organizationId!
    );

    sendSuccess(res, scorecard, 'Scorecard unlocked successfully');
  } catch (error) {
    next(error);
  }
}

export async function getDebriefPacket(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const packet = await scorecardService.getDebriefPacket(req.params.interviewId);
    sendSuccess(res, packet, 'Debrief packet retrieved successfully');
  } catch (error) {
    next(error);
  }
}
