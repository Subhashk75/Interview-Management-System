import { Response, NextFunction } from 'express';
import { schedulingService } from './scheduling.service.js';
import { Interview } from '../../models/Interview.js';
import { AuthRequest } from '../../middleware/auth.js';
import { sendSuccess } from '../../utils/response.js';

export async function generateSlots(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { interviewerIds, durationMinutes, startDate, endDate, bufferMinutes, timezone } = req.body;
    const slots = await schedulingService.generateAvailableSlots({
      organizationId: req.organizationId!,
      interviewerIds,
      durationMinutes: durationMinutes || 60,
      startDate,
      endDate,
      bufferMinutes: bufferMinutes !== undefined ? bufferMinutes : 15,
      timezone: timezone || 'UTC',
    });

    sendSuccess(res, slots, 'Generated available interview slots');
  } catch (error) {
    next(error);
  }
}

export async function bookInterview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { candidateId, jobId, roundId, interviewerIds, startTime, endTime, timezone, meetingType } = req.body;
    const interview = await schedulingService.bookInterview({
      organizationId: req.organizationId!,
      candidateId,
      jobId,
      roundId,
      interviewerIds,
      startTime,
      endTime,
      timezone,
      meetingType,
    });

    sendSuccess(res, interview, 'Interview successfully scheduled with calendar invite', 201);
  } catch (error) {
    next(error);
  }
}

export async function getInterviews(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, candidateId, jobId, interviewerId, startDate, endDate } = req.query;

    const filter: any = { organizationId: req.organizationId };
    if (status) filter.status = status;
    if (candidateId) filter.candidateId = candidateId;
    if (jobId) filter.jobId = jobId;
    if (interviewerId) filter['interviewers.userId'] = interviewerId;
    if (startDate && endDate) {
      filter.startTime = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }

    const interviews = await Interview.find(filter)
      .populate('candidateId', 'firstName lastName email currentCompany currentTitle resumeUrl')
      .populate('jobId', 'title department')
      .populate('roundId', 'name order type durationMinutes competencies')
      .populate('interviewers.userId', 'firstName lastName email title avatarUrl')
      .sort({ startTime: -1 });

    sendSuccess(res, interviews, 'Interviews fetched successfully');
  } catch (error) {
    next(error);
  }
}

export async function getInterviewById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    })
      .populate('candidateId')
      .populate('jobId')
      .populate('roundId')
      .populate('interviewers.userId', 'firstName lastName email title avatarUrl skills');

    sendSuccess(res, interview, 'Interview details');
  } catch (error) {
    next(error);
  }
}

export async function rescheduleInterview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { startTime, endTime, reason } = req.body;
    const interview = await schedulingService.rescheduleInterview(req.params.id, {
      startTime,
      endTime,
      reason,
    });
    sendSuccess(res, interview, 'Interview rescheduled successfully');
  } catch (error) {
    next(error);
  }
}

export async function cancelInterview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { reason } = req.body;
    const interview = await schedulingService.cancelInterview(req.params.id, reason);
    sendSuccess(res, interview, 'Interview cancelled successfully');
  } catch (error) {
    next(error);
  }
}
