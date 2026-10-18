export type UserRole = 'ADMIN' | 'RECRUITER' | 'INTERVIEWER' | 'CANDIDATE';

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
  submittedAt?: string;
  isBlinded?: boolean;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  availableInterviewers: string[];
  isConflicted: boolean;
}
