import mongoose, { Document, Schema } from 'mongoose';

export type OverallRecommendation = 'STRONG_NO' | 'NO' | 'MIXED' | 'YES' | 'STRONG_YES';

export interface ICompetencyRating {
  name: string;
  rating: number; // 1 to 5
  notes?: string;
}

export interface IScorecard extends Document {
  organizationId: mongoose.Types.ObjectId;
  interviewId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  interviewerId: mongoose.Types.ObjectId;
  ratings: ICompetencyRating[];
  overallRecommendation: OverallRecommendation;
  summaryFeedback: string;
  status: 'DRAFT' | 'SUBMITTED';
  weightedScore?: number;
  isUnlocked?: boolean;
  unlockedBy?: mongoose.Types.ObjectId;
  unlockReason?: string;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CompetencyRatingSchema = new Schema<ICompetencyRating>(
  {
    name: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    notes: { type: String },
  },
  { _id: false }
);

const ScorecardSchema = new Schema<IScorecard>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    interviewId: { type: Schema.Types.ObjectId, ref: 'Interview', required: true, index: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
    interviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ratings: [CompetencyRatingSchema],
    overallRecommendation: {
      type: String,
      enum: ['STRONG_NO', 'NO', 'MIXED', 'YES', 'STRONG_YES'],
      required: true,
    },
    summaryFeedback: { type: String, required: true },
    status: { type: String, enum: ['DRAFT', 'SUBMITTED'], default: 'DRAFT', index: true },
    weightedScore: { type: Number },
    isUnlocked: { type: Boolean, default: false },
    unlockedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    unlockReason: { type: String },
    submittedAt: { type: Date },
  },
  { timestamps: true }
);

ScorecardSchema.index({ interviewId: 1, interviewerId: 1 }, { unique: true });

export const Scorecard = mongoose.model<IScorecard>('Scorecard', ScorecardSchema);
