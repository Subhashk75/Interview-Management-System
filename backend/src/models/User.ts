import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'ADMIN' | 'HR' | 'RECRUITER' | 'INTERVIEWER' | 'MANAGER' | 'HIRING_MANAGER' | 'CANDIDATE';

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
  isVerified: boolean;
  mustChangePassword: boolean;
  createdBy?: mongoose.Types.ObjectId;
  otp?: string;
  otpExpiresAt?: Date;
  avatarUrl?: string;

  // Profile Management Fields
  phone?: string;
  location?: string;
  dateOfBirth?: string;
  gender?: string;
  bio?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  experienceYears?: number;
  hiringSpecialization?: string;
  assignedHiringTeams?: string[];
  interviewSpecializations?: string[];
  education?: string;
  currentCompany?: string;

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
      enum: ['ADMIN', 'HR', 'RECRUITER', 'INTERVIEWER', 'MANAGER', 'HIRING_MANAGER', 'CANDIDATE'],
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
    isVerified: { type: Boolean, default: false },
    mustChangePassword: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    otp: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    avatarUrl: { type: String },

    // Profile Management Fields
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    dateOfBirth: { type: String, trim: true },
    gender: { type: String, trim: true },
    bio: { type: String, trim: true },
    linkedinUrl: { type: String, trim: true },
    portfolioUrl: { type: String, trim: true },
    resumeUrl: { type: String, trim: true },
    experienceYears: { type: Number, default: 0 },
    hiringSpecialization: { type: String, trim: true },
    assignedHiringTeams: [{ type: String }],
    interviewSpecializations: [{ type: String }],
    education: { type: String, trim: true },
    currentCompany: { type: String, trim: true },
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
