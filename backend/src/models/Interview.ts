import mongoose, { Document, Schema } from 'mongoose';

export type InterviewStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'RESCHEDULED'
  | 'CANCELLED';

export interface IInterviewerAssignment {
  userId: mongoose.Types.ObjectId;
  responseStatus: 'NEEDS_ACTION' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';
  isLead: boolean;
}

export interface IInterview extends Document {
  organizationId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  roundId: mongoose.Types.ObjectId;
  interviewers: IInterviewerAssignment[];
  startTime: Date;
  endTime: Date;
  timezone: string;
  status: InterviewStatus;
  meetingType: 'GOOGLE_MEET' | 'MS_TEAMS' | 'ZOOM' | 'PHONE' | 'IN_PERSON';
  meetingUrl?: string;
  calendarEventId?: string;
  calendarProvider?: 'GOOGLE' | 'MICROSOFT' | 'LOCAL';
  rescheduleReason?: string;
  cancellationReason?: string;
  version: number; // Optimistic Concurrency Control
  createdAt: Date;
  updatedAt: Date;
}

const InterviewerAssignmentSchema = new Schema<IInterviewerAssignment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    responseStatus: {
      type: String,
      enum: ['NEEDS_ACTION', 'ACCEPTED', 'DECLINED', 'TENTATIVE'],
      default: 'ACCEPTED',
    },
    isLead: { type: Boolean, default: false },
  },
  { _id: false }
);

const InterviewSchema = new Schema<IInterview>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    roundId: { type: Schema.Types.ObjectId, ref: 'InterviewRound', required: true, index: true },
    interviewers: [InterviewerAssignmentSchema],
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true, index: true },
    timezone: { type: String, default: 'UTC' },
    status: {
      type: String,
      enum: ['DRAFT', 'SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'RESCHEDULED', 'CANCELLED'],
      default: 'SCHEDULED',
      index: true,
    },
    meetingType: {
      type: String,
      enum: ['GOOGLE_MEET', 'MS_TEAMS', 'ZOOM', 'PHONE', 'IN_PERSON'],
      default: 'GOOGLE_MEET',
    },
    meetingUrl: { type: String },
    calendarEventId: { type: String },
    calendarProvider: { type: String, enum: ['GOOGLE', 'MICROSOFT', 'LOCAL'], default: 'LOCAL' },
    rescheduleReason: { type: String },
    cancellationReason: { type: String },
    version: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// High-performance compound index to prevent scheduling overlaps
InterviewSchema.index({
  organizationId: 1,
  'interviewers.userId': 1,
  startTime: 1,
  endTime: 1,
  status: 1,
});

export const Interview = mongoose.model<IInterview>('Interview', InterviewSchema);
