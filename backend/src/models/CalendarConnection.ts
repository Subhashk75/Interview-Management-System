import mongoose, { Document, Schema } from 'mongoose';

export interface ICalendarConnection extends Document {
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  provider: 'GOOGLE' | 'MICROSOFT';
  calendarEmail: string;
  encryptedAccessToken: string;
  encryptedRefreshToken: string;
  tokenExpiresAt: Date;
  webhookChannelId?: string;
  webhookResourceId?: string;
  webhookExpiresAt?: Date;
  syncStatus: 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'DISCONNECTED';
  createdAt: Date;
  updatedAt: Date;
}

const CalendarConnectionSchema = new Schema<ICalendarConnection>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    provider: { type: String, enum: ['GOOGLE', 'MICROSOFT'], required: true },
    calendarEmail: { type: String, required: true },
    encryptedAccessToken: { type: String, required: true },
    encryptedRefreshToken: { type: String, required: true },
    tokenExpiresAt: { type: Date, required: true },
    webhookChannelId: { type: String },
    webhookResourceId: { type: String },
    webhookExpiresAt: { type: Date },
    syncStatus: {
      type: String,
      enum: ['ACTIVE', 'REVOKED', 'EXPIRED', 'DISCONNECTED'],
      default: 'ACTIVE',
    },
  },
  { timestamps: true }
);

export const CalendarConnection = mongoose.model<ICalendarConnection>(
  'CalendarConnection',
  CalendarConnectionSchema
);
