import mongoose from 'mongoose';
import crypto from 'crypto';
import { Interview, IInterview } from '../../models/Interview.js';
import { User } from '../../models/User.js';
import { Candidate } from '../../models/Candidate.js';
import { InterviewRound } from '../../models/InterviewRound.js';
import { Job } from '../../models/Job.js';
import { BookingInvitation, IBookingInvitation } from '../../models/BookingInvitation.js';
import { calendarService } from '../calendar/calendar.service.js';
import { emailService } from '../notifications/email.service.js';
import { lockManager } from '../../utils/lockManager.js';
import { AppError } from '../../utils/appError.js';
import { logger } from '../../utils/logger.js';

export interface GenerateSlotsParams {
  organizationId: string;
  interviewerIds: string[];
  durationMinutes: number;
  startDate: string; // ISO string or YYYY-MM-DD
  endDate: string;   // ISO string or YYYY-MM-DD
  bufferMinutes?: number;
  timezone?: string;
  enforceQuotas?: boolean;
}

export interface TimeSlot {
  startTime: string; // ISO
  endTime: string;   // ISO
  availableInterviewers: string[];
  isConflicted: boolean;
}

export class SchedulingService {
  /**
   * Generates available candidate slots by calculating the interval intersection of all panelists.
   * Enforces working hours, buffer windows, and daily/weekly interviewer quotas.
   */
  async generateAvailableSlots(params: GenerateSlotsParams): Promise<TimeSlot[]> {
    const {
      organizationId,
      interviewerIds,
      durationMinutes,
      startDate,
      endDate,
      bufferMinutes = 15,
      enforceQuotas = true,
    } = params;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Expand search boundaries to cover start/end of the relevant weeks for accurate weekly capacity calculation
    const queryMin = new Date(start);
    queryMin.setDate(queryMin.getDate() - 7);
    const queryMax = new Date(end);
    queryMax.setDate(queryMax.getDate() + 7);

    // Fetch existing confirmed/scheduled interviews for these interviewers in this range
    const existingInterviews = await Interview.find({
      organizationId,
      'interviewers.userId': { $in: interviewerIds.map((id) => new mongoose.Types.ObjectId(id)) },
      status: { $in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
      startTime: { $gte: queryMin, $lte: queryMax },
    });

    // Fetch interviewer profiles for quota configuration
    const interviewerUsers = await User.find({ _id: { $in: interviewerIds } });
    const quotaMap = new Map<string, { dailyLimit: number; weeklyCapacityHours: number }>();
    interviewerUsers.forEach((u) => {
      quotaMap.set(u._id.toString(), {
        dailyLimit: u.dailyInterviewLimit || 2,
        weeklyCapacityHours: u.weeklyCapacityHours || 5,
      });
    });

    const slots: TimeSlot[] = [];
    const slotDurationMs = durationMinutes * 60 * 1000;
    const bufferMs = bufferMinutes * 60 * 1000;

    // Iterate day by day between start and end
    const currentDay = new Date(start);
    while (currentDay <= end) {
      // Skip weekends (0 = Sunday, 6 = Saturday)
      const dayOfWeek = currentDay.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Working hours: 09:00 to 18:00
        const dayStart = new Date(currentDay);
        dayStart.setHours(9, 0, 0, 0);

        const dayEnd = new Date(currentDay);
        dayEnd.setHours(18, 0, 0, 0);

        // Pre-compute daily count and weekly hours for each interviewer on this day
        const dayStartBound = new Date(currentDay);
        dayStartBound.setHours(0, 0, 0, 0);
        const dayEndBound = new Date(currentDay);
        dayEndBound.setHours(23, 59, 59, 999);

        // Calculate Monday 00:00:00 to Sunday 23:59:59.999 of current week
        const weekMonday = new Date(currentDay);
        const dayIndex = currentDay.getDay(); // 1 = Mon, ... 5 = Fri
        weekMonday.setDate(currentDay.getDate() - (dayIndex === 0 ? 6 : dayIndex - 1));
        weekMonday.setHours(0, 0, 0, 0);
        const weekSunday = new Date(weekMonday);
        weekSunday.setDate(weekSunday.getDate() + 6);
        weekSunday.setHours(23, 59, 59, 999);

        const quotaConflictedInterviewers = new Set<string>();

        if (enforceQuotas) {
          for (const interviewerId of interviewerIds) {
            const quota = quotaMap.get(interviewerId);
            if (!quota) continue;

            // 1. Check daily count
            const dailyInterviews = existingInterviews.filter((inv) => {
              const isAssigned = inv.interviewers.some((i) => i.userId.toString() === interviewerId);
              return isAssigned && inv.startTime >= dayStartBound && inv.startTime <= dayEndBound;
            });

            if (dailyInterviews.length >= quota.dailyLimit) {
              quotaConflictedInterviewers.add(interviewerId);
              continue;
            }

            // 2. Check weekly hours
            const weeklyInterviews = existingInterviews.filter((inv) => {
              const isAssigned = inv.interviewers.some((i) => i.userId.toString() === interviewerId);
              return isAssigned && inv.startTime >= weekMonday && inv.startTime <= weekSunday;
            });

            const currentWeeklyHours = weeklyInterviews.reduce((acc, inv) => {
              return acc + (inv.endTime.getTime() - inv.startTime.getTime()) / (1000 * 60 * 60);
            }, 0);

            if (currentWeeklyHours + durationMinutes / 60 > quota.weeklyCapacityHours) {
              quotaConflictedInterviewers.add(interviewerId);
            }
          }
        }

        // If any required interviewer is already past quota for the whole day, skip time loop for panel
        if (quotaConflictedInterviewers.size === 0) {
          let slotStart = new Date(dayStart);
          while (new Date(slotStart.getTime() + slotDurationMs) <= dayEnd) {
            const slotEnd = new Date(slotStart.getTime() + slotDurationMs);

            // Check for conflicts across each interviewer
            const conflictingInterviewers: string[] = [];
            for (const interviewerId of interviewerIds) {
              const hasConflict = existingInterviews.some((interview) => {
                const isAssigned = interview.interviewers.some(
                  (inv) => inv.userId.toString() === interviewerId
                );
                if (!isAssigned) return false;

                const existingStart = new Date(interview.startTime.getTime() - bufferMs);
                const existingEnd = new Date(interview.endTime.getTime() + bufferMs);

                // Overlap check
                return slotStart < existingEnd && slotEnd > existingStart;
              });

              if (hasConflict) {
                conflictingInterviewers.push(interviewerId);
              }
            }

            const availableInterviewers = interviewerIds.filter(
              (id) => !conflictingInterviewers.includes(id)
            );

            // If all required interviewers are free, add as a clean candidate slot
            if (availableInterviewers.length === interviewerIds.length) {
              slots.push({
                startTime: slotStart.toISOString(),
                endTime: slotEnd.toISOString(),
                availableInterviewers,
                isConflicted: false,
              });
            }

            // Advance by 30-minute grid increments
            slotStart = new Date(slotStart.getTime() + 30 * 60 * 1000);
          }
        }
      }
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return slots;
  }

  /**
   * Atomically books an interview session.
   * Protected by distributed mutex lock, DB overlap check, OCC, and calendar synchronization.
   */
  async bookInterview(data: {
    organizationId: string;
    candidateId: string;
    jobId: string;
    roundId: string;
    interviewerIds: string[];
    startTime: string | Date;
    endTime: string | Date;
    timezone?: string;
    meetingType?: 'GOOGLE_MEET' | 'MS_TEAMS' | 'ZOOM' | 'PHONE' | 'IN_PERSON';
    organizerId?: string;
  }): Promise<IInterview> {
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (startTime >= endTime) {
      throw new AppError('Start time must be strictly before end time.', 400, 'INVALID_TIME_RANGE');
    }

    // Acquire serialized lock on all panelists and candidate to eliminate race conditions
    const lockKeys = [
      ...data.interviewerIds.map((id) => `interviewer:${id}`),
      `candidate:${data.candidateId}`,
    ];

    return await lockManager.withLock(lockKeys, async () => {
      // Step 1: Pre-flight DB overlap check inside serialized lock
      const overlapping = await Interview.find({
        organizationId: data.organizationId,
        'interviewers.userId': { $in: data.interviewerIds.map((id) => new mongoose.Types.ObjectId(id)) },
        status: { $in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      });

      if (overlapping.length > 0) {
        throw new AppError(
          'Conflict detected: One or more interviewers are already booked during this time window.',
          409,
          'SLOT_DOUBLE_BOOKED'
        );
      }

      // Step 2: Fetch metadata for calendar invite
      const candidate = await Candidate.findById(data.candidateId);
      const job = await Job.findById(data.jobId);
      let round = await InterviewRound.findById(data.roundId);
      if (!round && job) {
        // Fallback: check first round of job
        round = await InterviewRound.findOne({ jobId: job._id }).sort({ order: 1 });
      }
      const interviewers = await User.find({ _id: { $in: data.interviewerIds } });

      if (!candidate || !job || !round) {
        throw new AppError('Candidate, Job, or Round not found.', 404, 'RESOURCE_NOT_FOUND');
      }

      const leadInterviewer = interviewers[0];
      const attendees = [
        { email: candidate.email, name: `${candidate.firstName} ${candidate.lastName}` },
        ...interviewers.map((i) => ({ email: i.email, name: `${i.firstName} ${i.lastName}` })),
      ];

      // Step 3: Create external calendar event with Google Meet / Teams link
      const calResult = await calendarService.createMeeting(leadInterviewer ? leadInterviewer._id.toString() : '', {
        summary: `Interview: ${candidate.firstName} ${candidate.lastName} - ${job.title} (${round.name})`,
        description: `Interview round: ${round.name}\nCandidate: ${candidate.firstName} ${candidate.lastName} (${candidate.email})\nJob: ${job.title}\nDepartment: ${job.department}`,
        startTime,
        endTime,
        attendees,
        createMeetLink: data.meetingType === 'GOOGLE_MEET' || !data.meetingType,
      });

      // Step 4: Persist interview document
      const interview = new Interview({
        organizationId: data.organizationId,
        candidateId: data.candidateId,
        jobId: data.jobId,
        roundId: round._id,
        interviewers: data.interviewerIds.map((id, index) => ({
          userId: id,
          responseStatus: 'ACCEPTED',
          isLead: index === 0,
        })),
        startTime,
        endTime,
        timezone: data.timezone || 'UTC',
        status: 'SCHEDULED',
        meetingType: data.meetingType || 'GOOGLE_MEET',
        meetingUrl: calResult.meetingUrl,
        calendarEventId: calResult.eventId,
        version: 0,
      });

      await interview.save();
      logger.info(`Scheduled interview ${interview._id} for candidate ${candidate.email} at ${startTime.toISOString()}`);

      // Step 5: Send notification emails to Candidate, Interviewers, and HR/Organizer
      try {
        let organizer: any = null;
        if (data.organizerId) {
          organizer = await User.findById(data.organizerId);
        }
        await emailService.sendInterviewScheduledNotifications({
          interview,
          candidate,
          job,
          round,
          interviewers,
          organizer,
        });
      } catch (emailErr: any) {
        logger.error('Error dispatching interview notification emails:', emailErr);
      }

      return interview;
    });
  }

  /**
   * Reschedules an interview atomically with serialized concurrency locks.
   */
  async rescheduleInterview(
    interviewId: string,
    data: { startTime: string | Date; endTime: string | Date; reason?: string }
  ): Promise<IInterview> {
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found.', 404, 'NOT_FOUND');
    }

    if (['COMPLETED', 'CANCELLED'].includes(interview.status)) {
      throw new AppError(`Cannot reschedule an interview in '${interview.status}' status.`, 400, 'INVALID_STATUS');
    }

    const interviewerIds = interview.interviewers.map((i) => i.userId.toString());
    const lockKeys = [
      ...interviewerIds.map((id) => `interviewer:${id}`),
      `candidate:${interview.candidateId.toString()}`,
    ];

    return await lockManager.withLock(lockKeys, async () => {
      const newStart = new Date(data.startTime);
      const newEnd = new Date(data.endTime);

      // Overlap validation
      const overlapping = await Interview.find({
        _id: { $ne: interview._id },
        organizationId: interview.organizationId,
        'interviewers.userId': { $in: interviewerIds },
        status: { $in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
        startTime: { $lt: newEnd },
        endTime: { $gt: newStart },
      });

      if (overlapping.length > 0) {
        throw new AppError('Conflict detected for new slot.', 409, 'SLOT_DOUBLE_BOOKED');
      }

      // Update calendar event if present
      if (interview.calendarEventId) {
        const lead = interview.interviewers.find((i) => i.isLead) || interview.interviewers[0];
        if (lead) {
          await calendarService.updateMeeting(lead.userId.toString(), interview.calendarEventId, {
            startTime: newStart,
            endTime: newEnd,
          });
        }
      }

      interview.startTime = newStart;
      interview.endTime = newEnd;
      interview.status = 'RESCHEDULED';
      interview.rescheduleReason = data.reason || 'Rescheduled by hiring team';
      interview.version += 1;

      await interview.save();
      logger.info(`Rescheduled interview ${interviewId} to ${newStart.toISOString()}`);
      return interview;
    });
  }

  /**
   * Cancels an interview and frees up calendar holds.
   */
  async cancelInterview(interviewId: string, reason?: string): Promise<IInterview> {
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found.', 404, 'NOT_FOUND');
    }

    if (interview.status === 'CANCELLED') {
      return interview;
    }

    if (interview.calendarEventId) {
      const lead = interview.interviewers.find((i) => i.isLead) || interview.interviewers[0];
      if (lead) {
        await calendarService.cancelMeeting(lead.userId.toString(), interview.calendarEventId);
      }
    }

    interview.status = 'CANCELLED';
    interview.cancellationReason = reason || 'Cancelled by recruiter/candidate';
    interview.version += 1;

    await interview.save();
    logger.info(`Cancelled interview ${interviewId}`);
    return interview;
  }

  /**
   * Creates a tokenized Candidate Self-Scheduling link (Ashby / Greenhouse model).
   */
  async createBookingInvitation(data: {
    organizationId: string;
    candidateId: string;
    jobId: string;
    roundId: string;
    interviewerIds: string[];
    durationMinutes?: number;
    meetingType?: 'GOOGLE_MEET' | 'MS_TEAMS' | 'ZOOM' | 'PHONE' | 'IN_PERSON';
    expiryDays?: number;
  }): Promise<IBookingInvitation> {
    const token = crypto.randomBytes(24).toString('hex');
    const expiryDays = data.expiryDays || 7;
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    const invitation = new BookingInvitation({
      organizationId: data.organizationId,
      candidateId: data.candidateId,
      jobId: data.jobId,
      roundId: data.roundId,
      interviewerIds: data.interviewerIds,
      token,
      durationMinutes: data.durationMinutes || 60,
      meetingType: data.meetingType || 'GOOGLE_MEET',
      expiresAt,
      status: 'ACTIVE',
    });

    await invitation.save();
    logger.info(`Generated candidate booking invitation token for candidate ${data.candidateId}`);
    return invitation;
  }

  /**
   * Public retrieval of self-scheduling details and dynamically calculated slots.
   */
  async getPublicInvitation(token: string): Promise<{
    invitation: any;
    availableSlots: TimeSlot[];
  }> {
    const invitation = await BookingInvitation.findOne({ token })
      .populate('candidateId', 'firstName lastName email timezone')
      .populate('jobId', 'title department location')
      .populate('roundId', 'name order type durationMinutes competencies')
      .populate('interviewerIds', 'firstName lastName title avatarUrl skills');

    if (!invitation) {
      throw new AppError('Invalid or expired interview scheduling invitation.', 404, 'INVITATION_NOT_FOUND');
    }

    if (invitation.status === 'BOOKED') {
      throw new AppError('This interview session has already been booked.', 400, 'ALREADY_BOOKED');
    }

    if (invitation.status !== 'ACTIVE' || new Date() > invitation.expiresAt) {
      invitation.status = 'EXPIRED';
      await invitation.save();
      throw new AppError('This scheduling link has expired. Please contact your recruiter.', 410, 'INVITATION_EXPIRED');
    }

    // Generate conflict-free slots for the upcoming 7 business days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // Start tomorrow
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 8);

    const availableSlots = await this.generateAvailableSlots({
      organizationId: invitation.organizationId.toString(),
      interviewerIds: invitation.interviewerIds.map((u: any) => u._id.toString()),
      durationMinutes: invitation.durationMinutes,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      bufferMinutes: 15,
      enforceQuotas: true,
    });

    return {
      invitation,
      availableSlots,
    };
  }

  /**
   * Public candidate booking execution.
   */
  async bookPublicInvitation(
    token: string,
    data: { startTime: string | Date; endTime: string | Date }
  ): Promise<{ interview: IInterview; invitation: IBookingInvitation }> {
    const invitation = await BookingInvitation.findOne({ token });
    if (!invitation || invitation.status !== 'ACTIVE') {
      throw new AppError('Invalid or expired scheduling invitation.', 404, 'INVITATION_NOT_FOUND');
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = 'EXPIRED';
      await invitation.save();
      throw new AppError('This scheduling link has expired.', 410, 'INVITATION_EXPIRED');
    }

    // Book interview atomically
    const interview = await this.bookInterview({
      organizationId: invitation.organizationId.toString(),
      candidateId: invitation.candidateId.toString(),
      jobId: invitation.jobId.toString(),
      roundId: invitation.roundId.toString(),
      interviewerIds: invitation.interviewerIds.map((id) => id.toString()),
      startTime: data.startTime,
      endTime: data.endTime,
      meetingType: invitation.meetingType,
    });

    invitation.status = 'BOOKED';
    invitation.bookedInterviewId = interview._id as mongoose.Types.ObjectId;
    await invitation.save();

    logger.info(`Candidate self-booked interview ${interview._id} using invitation token.`);
    return { interview, invitation };
  }
}

export const schedulingService = new SchedulingService();
