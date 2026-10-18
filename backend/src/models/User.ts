import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'ADMIN' | 'RECRUITER' | 'INTERVIEWER' | 'CANDIDATE';

export interface IUser extends Document {
  organizationId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: UserRole;
  title?: string;
  department?: string;
  timezone: string;
  skills: string[];
  weeklyCapacityHours: number;
  dailyInterviewLimit: number;
  isActive: boolean;
  avatarUrl?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    role: {
      type: String,
      enum: ['ADMIN', 'RECRUITER', 'INTERVIEWER', 'CANDIDATE'],
      default: 'INTERVIEWER',
      index: true,
    },
    title: { type: String, default: 'Software Engineer' },
    department: { type: String, default: 'Engineering' },
    timezone: { type: String, default: 'UTC' },
    skills: [{ type: String }],
    weeklyCapacityHours: { type: Number, default: 5 },
    dailyInterviewLimit: { type: Number, default: 2 },
    isActive: { type: Boolean, default: true },
    avatarUrl: { type: String },
  },
  { timestamps: true }
);

UserSchema.index({ organizationId: 1, email: 1 }, { unique: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
