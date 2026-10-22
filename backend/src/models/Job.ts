import mongoose, { Document, Schema } from 'mongoose';

export type JobStatus = 'DRAFT' | 'OPEN' | 'PAUSED' | 'CLOSED';

export interface IJob extends Document {
  organizationId: mongoose.Types.ObjectId;
  title: string;
  department: string;
  location: string;
  employmentType: string; // 'FULL_TIME' | 'CONTRACT' | 'INTERN'
  status: JobStatus;
  openingsCount: number;
  hiringManagerId: mongoose.Types.ObjectId;
  recruiterId: mongoose.Types.ObjectId;
  description?: string;
  requirements?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true, trim: true },
    department: { type: String, required: true },
    location: { type: String, default: 'Remote' },
    employmentType: { type: String, default: 'FULL_TIME' },
    status: { type: String, enum: ['DRAFT', 'OPEN', 'PAUSED', 'CLOSED'], default: 'OPEN', index: true },
    openingsCount: { type: Number, default: 1, min: 1 },
    hiringManagerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recruiterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String },
    requirements: [{ type: String }],
  },
  { timestamps: true }
);

export const Job = mongoose.model<IJob>('Job', JobSchema);
