import mongoose, { Document, Schema } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  domain?: string;
  settings: {
    timezone: string;
    workingHoursStart: string; // e.g. "09:00"
    workingHoursEnd: string;   // e.g. "18:00"
    defaultBufferMinutes: number;
    scorecardBlindingEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    domain: { type: String, lowercase: true, trim: true },
    settings: {
      timezone: { type: String, default: 'UTC' },
      workingHoursStart: { type: String, default: '09:00' },
      workingHoursEnd: { type: String, default: '18:00' },
      defaultBufferMinutes: { type: Number, default: 15 },
      scorecardBlindingEnabled: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
