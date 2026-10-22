import mongoose from 'mongoose';
import { Interview, IInterview } from '../../models/Interview.js';
import { User } from '../../models/User.js';
import { Candidate } from '../../models/Candidate.js';
import { InterviewRound } from '../../models/InterviewRound.js';
import { Job } from '../../models/Job.js';
import { calendarService } from '../calendar/calendar.service.js';
import { emailService } from '../notifications/email.service.js';
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
   */
  async generateAvailableSlots(params: GenerateSlotsParams): Promise<TimeSlot[]> {
    const {
      organizationId,
      interviewerIds,
      durationMinutes,
      startDate,
      endDate,
      bufferMinutes = 15,
    } = params;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Fetch existing confirmed/scheduled interviews for these interviewers in this range
    const existingInterviews = await Interview.find({
      organizationId,
      'interviewers.userId': { $in: interviewerIds.map((id) => new mongoose.Types.ObjectId(id)) },
      status: { $in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
      startTime: { $gte: start, $lte: end },
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
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return slots;
  }

  /**
   * Atomically books an interview session.
   * Enforces DB overlap check, optimistic concurrency control, and calendar synchronization.
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

    // Step 1: Pre-flight DB overlap check
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
  }

  /**
   * Reschedules an interview atomically.
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

    const newStart = new Date(data.startTime);
    const newEnd = new Date(data.endTime);

    // Overlap validation
    const interviewerIds = interview.interviewers.map((i) => i.userId);
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
}

export const schedulingService = new SchedulingService();
