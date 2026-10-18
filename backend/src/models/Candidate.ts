import mongoose, { Document, Schema } from 'mongoose';

export interface ICandidate extends Document {
  organizationId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  currentCompany?: string;
  currentTitle?: string;
  experienceYears?: number;
  skills: string[];
  resumeUrl?: string;
  linkedinUrl?: string;
  timezone: string;
  notes?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateSchema = new Schema<ICandidate>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    currentCompany: { type: String },
    currentTitle: { type: String },
    experienceYears: { type: Number, default: 0 },
    skills: [{ type: String }],
    resumeUrl: { type: String },
    linkedinUrl: { type: String },
    timezone: { type: String, default: 'UTC' },
    notes: { type: String },
    isArchived: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

CandidateSchema.index({ organizationId: 1, email: 1 }, { unique: true });
CandidateSchema.index({ firstName: 'text', lastName: 'text', email: 'text', currentCompany: 'text' });

export const Candidate = mongoose.model<ICandidate>('Candidate', CandidateSchema);
