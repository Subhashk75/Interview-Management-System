import mongoose, { Document, Schema } from 'mongoose';

export type InvitationStatus = 'ACTIVE' | 'BOOKED' | 'EXPIRED' | 'REVOKED';

export interface IBookingInvitation extends Document {
  organizationId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  roundId: mongoose.Types.ObjectId;
  interviewerIds: mongoose.Types.ObjectId[];
  token: string;
  status: InvitationStatus;
  durationMinutes: number;
  meetingType: 'GOOGLE_MEET' | 'MS_TEAMS' | 'ZOOM' | 'PHONE' | 'IN_PERSON';
  bookedInterviewId?: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BookingInvitationSchema = new Schema<IBookingInvitation>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    roundId: { type: Schema.Types.ObjectId, ref: 'InterviewRound', required: true },
    interviewerIds: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    token: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'BOOKED', 'EXPIRED', 'REVOKED'],
      default: 'ACTIVE',
      index: true,
    },
    durationMinutes: { type: Number, default: 60 },
    meetingType: {
      type: String,
      enum: ['GOOGLE_MEET', 'MS_TEAMS', 'ZOOM', 'PHONE', 'IN_PERSON'],
      default: 'GOOGLE_MEET',
    },
    bookedInterviewId: { type: Schema.Types.ObjectId, ref: 'Interview' },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

export const BookingInvitation = mongoose.model<IBookingInvitation>(
  'BookingInvitation',
  BookingInvitationSchema
);
