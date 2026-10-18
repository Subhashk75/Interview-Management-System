import mongoose, { Document, Schema } from 'mongoose';

export interface ICompetencyTemplate {
  name: string;
  description: string;
  weight: number;
}

export interface IInterviewRound extends Document {
  organizationId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  name: string;
  order: number;
  type: string; // 'SCREEN', 'TECHNICAL', 'SYSTEM_DESIGN', 'BEHAVIORAL', 'LEADERSHIP'
  durationMinutes: number;
  requiredInterviewerCount: number;
  qualifiedInterviewerPool: mongoose.Types.ObjectId[];
  competencies: ICompetencyTemplate[];
  instructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompetencyTemplateSchema = new Schema<ICompetencyTemplate>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    weight: { type: Number, default: 1 },
  },
  { _id: false }
);

const InterviewRoundSchema = new Schema<IInterviewRound>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true },
    type: { type: String, default: 'TECHNICAL' },
    durationMinutes: { type: Number, required: true, default: 60 },
    requiredInterviewerCount: { type: Number, default: 1 },
    qualifiedInterviewerPool: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    competencies: [CompetencyTemplateSchema],
    instructions: { type: String },
  },
  { timestamps: true }
);

InterviewRoundSchema.index({ jobId: 1, order: 1 });

export const InterviewRound = mongoose.model<IInterviewRound>('InterviewRound', InterviewRoundSchema);
