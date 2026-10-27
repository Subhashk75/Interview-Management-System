export type UserRole = 'ADMIN' | 'RECRUITER' | 'INTERVIEWER' | 'CANDIDATE';
export type CandidateStage = 'APPLIED' | 'SCREENING' | 'INTERVIEWING' | 'OFFER' | 'HIRED' | 'REJECTED';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  title?: string;
  department?: string;
  skills?: string[];
  weeklyCapacityHours?: number;
  dailyInterviewLimit?: number;
  isActive?: boolean;
  isVerified?: boolean;
  avatarUrl?: string;
}

export interface Candidate {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  currentCompany?: string;
  currentTitle?: string;
  experienceYears?: number;
  skills: string[];
  appliedJobId?: Job | { _id: string; title: string; department: string; location?: string };
  stage?: 'APPLIED' | 'SCREENING' | 'INTERVIEWING' | 'OFFER' | 'HIRED' | 'REJECTED';
  resumeUrl?: string;
  linkedinUrl?: string;
  timezone: string;
  notes?: string;
  createdAt: string;
}

export interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  status: 'DRAFT' | 'OPEN' | 'PAUSED' | 'CLOSED';
  openingsCount?: number;
  hiringManagerId?: User;
  recruiterId?: User;
  rounds?: InterviewRound[];
}

export interface InterviewRound {
  _id: string;
  jobId: string;
  name: string;
  order: number;
  type: string;
  durationMinutes: number;
  requiredInterviewerCount: number;
  competencies: { name: string; description: string; weight: number }[];
}

export interface Interview {
  _id: string;
  candidateId: Candidate;
  jobId: Job;
  roundId: InterviewRound;
  interviewers: {
    userId: User;
    responseStatus: 'NEEDS_ACTION' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';
    isLead: boolean;
  }[];
  startTime: string;
  endTime: string;
  timezone: string;
  status: 'DRAFT' | 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'RESCHEDULED' | 'CANCELLED';
  meetingType: string;
  meetingUrl?: string;
  calendarEventId?: string;
  version: number;
}

export interface Scorecard {
  _id: string;
  interviewId: string;
  candidateId: string;
  interviewerId: User;
  ratings: { name: string; rating: number; notes?: string }[];
  overallRecommendation: 'STRONG_NO' | 'NO' | 'MIXED' | 'YES' | 'STRONG_YES';
  summaryFeedback: string;
  status: 'DRAFT' | 'SUBMITTED';
  weightedScore?: number;
  isUnlocked?: boolean;
  unlockedBy?: string;
  unlockReason?: string;
  submittedAt?: string;
  isBlinded?: boolean;
}

export interface DebriefPacket {
  interview: Interview;
  scorecards: Scorecard[];
  metrics: {
    totalAssignedPanelists: number;
    submittedCount: number;
    averageWeightedScore: number;
    recommendationsCount: {
      STRONG_NO: number;
      NO: number;
      MIXED: number;
      YES: number;
      STRONG_YES: number;
    };
    consensusStatus: 'CONSENSUS_HIRE' | 'CONSENSUS_NO_HIRE' | 'DIVERGENT_DEBRIEF_REQUIRED' | 'PENDING_EVALUATIONS';
  };
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  availableInterviewers: string[];
  isConflicted: boolean;
}

export interface OpenRoleStat {
  _id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  status: string;
  openingsCount: number;
  applicantCount: number;
  candidatesByStage: Record<string, number>;
  interviewsScheduled: number;
  roundsCount: number;
  hiringManager?: { firstName: string; lastName: string; title?: string };
  recruiter?: { firstName: string; lastName: string };
}

export interface CandidateWithRole {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  currentCompany?: string;
  currentTitle?: string;
  skills: string[];
  appliedJob?: { _id: string; title: string; department: string; location?: string };
  stage: 'APPLIED' | 'SCREENING' | 'INTERVIEWING' | 'OFFER' | 'HIRED' | 'REJECTED';
  latestInterview?: {
    _id: string;
    roundName: string;
    startTime: string;
    endTime: string;
    status: string;
    meetingUrl?: string;
  };
  hasPendingScorecard: boolean;
  createdAt: string;
}

export interface PendingFeedbackItem {
  _id: string;
  interviewId: string;
  candidate: { _id?: string; firstName: string; lastName: string; email: string };
  job: { _id?: string; title: string; department: string };
  round: { _id?: string; name: string; type: string };
  startTime: string;
  endTime: string;
  meetingUrl?: string;
  elapsedHours: number;
  isOverdue: boolean;
  panelists: {
    userId?: string;
    name: string;
    avatarUrl?: string;
    title?: string;
    hasSubmitted: boolean;
    scorecardStatus: 'DRAFT' | 'SUBMITTED' | 'NOT_STARTED';
  }[];
  pendingCount: number;
  totalPanelists: number;
}

export interface DashboardStats {
  totalCandidates: number;
  activeJobs: number;
  totalOpenings: number;
  totalInterviews: number;
  pendingScorecardsCount: number;
  openRoles: OpenRoleStat[];
  candidatesWithRole: CandidateWithRole[];
  pendingFeedbackInterviews: PendingFeedbackItem[];
  funnelStats: Record<string, number>;
  upcomingInterviews: Interview[];
  statusBreakdown: Record<string, number>;
  interviewerCount: number;
  interviewers: any[];
}
