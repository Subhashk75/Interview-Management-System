import mongoose from 'mongoose';
import { ENV } from './env.js';
import { logger } from '../utils/logger.js';
import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';
import { Candidate } from '../models/Candidate.js';
import { Job } from '../models/Job.js';
import { InterviewRound } from '../models/InterviewRound.js';
import { Interview } from '../models/Interview.js';
import { Scorecard } from '../models/Scorecard.js';

let mongoMemoryServer: any = null;

export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);

  try {
    // Try standard configured URI first (timeout quickly if unavailable)
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    logger.info(`✅ Connected to MongoDB: ${ENV.MONGODB_URI}`);
  } catch (error: any) {
    logger.warn(`⚠️ Local/configured MongoDB unreachable (${error.message}). Initializing In-Memory MongoDB Engine...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const memoryUri = mongoMemoryServer.getUri();
      await mongoose.connect(memoryUri);
      logger.info(`✅ In-Memory MongoDB Server initialized and connected at: ${memoryUri}`);
    } catch (memErr: any) {
      logger.error('Failed to initialize in-memory Mongo server:', memErr);
    }
  }

  // Check if database needs initial seeding
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      logger.info('Database is empty. Populating default seed dataset...');
      await autoSeedData();
    }
  } catch (seedErr: any) {
    logger.error('Error during auto-seed check:', seedErr);
  }
}

async function autoSeedData() {
  const org = await Organization.create({
    name: 'Acme Technologies Global',
    domain: 'acme.com',
    settings: {
      timezone: 'America/New_York',
      workingHoursStart: '09:00',
      workingHoursEnd: '18:00',
      defaultBufferMinutes: 15,
      scorecardBlindingEnabled: true,
    },
  });

  const admin = await User.create({
    organizationId: org._id,
    firstName: 'Sarah',
    lastName: 'Connor',
    email: 'admin@acme.com',
    password: 'Password123!',
    role: 'ADMIN',
    title: 'VP of People & Talent',
    department: 'HR & Operations',
    skills: ['Leadership', 'Executive Search', 'Compensation'],
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  });

  const recruiter = await User.create({
    organizationId: org._id,
    firstName: 'Alex',
    lastName: 'Rivera',
    email: 'recruiter@acme.com',
    password: 'Password123!',
    role: 'RECRUITER',
    title: 'Senior Technical Recruiter',
    department: 'Talent Acquisition',
    skills: ['Engineering Recruiting', 'Sourcing', 'Pipeline Management'],
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  });

  const interviewer1 = await User.create({
    organizationId: org._id,
    firstName: 'David',
    lastName: 'Kim',
    email: 'david.kim@acme.com',
    password: 'Password123!',
    role: 'INTERVIEWER',
    title: 'Staff Distributed Systems Engineer',
    department: 'Platform Engineering',
    skills: ['System Design', 'Distributed Systems', 'Go', 'Node.js', 'MongoDB', 'Kafka'],
    weeklyCapacityHours: 4,
    dailyInterviewLimit: 2,
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  });

  const interviewer2 = await User.create({
    organizationId: org._id,
    firstName: 'Elena',
    lastName: 'Rostova',
    email: 'elena.rostova@acme.com',
    password: 'Password123!',
    role: 'INTERVIEWER',
    title: 'Lead Frontend Architect',
    department: 'Product Engineering',
    skills: ['React', 'TypeScript', 'Frontend Architecture', 'Web Performance', 'UI/UX'],
    weeklyCapacityHours: 5,
    dailyInterviewLimit: 2,
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
  });

  const job1 = await Job.create({
    organizationId: org._id,
    title: 'Senior Full Stack Engineer (MERN / Distributed)',
    department: 'Product Engineering',
    location: 'New York / Hybrid',
    employmentType: 'FULL_TIME',
    status: 'OPEN',
    openingsCount: 3,
    hiringManagerId: interviewer1._id,
    recruiterId: recruiter._id,
    description: 'Looking for a Senior Full Stack Engineer to lead scalable interview workflow microservices.',
    requirements: ['5+ years React/Node.js', 'Experience with distributed systems', 'Strong API design'],
  });

  const job2 = await Job.create({
    organizationId: org._id,
    title: 'Staff Distributed Systems Architect',
    department: 'Platform Engineering',
    location: 'Remote',
    employmentType: 'FULL_TIME',
    status: 'OPEN',
    openingsCount: 2,
    hiringManagerId: interviewer1._id,
    recruiterId: recruiter._id,
    description: 'Architect next-generation real-time availability and calendar synchronization engines.',
    requirements: ['8+ years distributed systems', 'Redis locking & ACID transactions', 'Cloud native'],
  });

  const job3 = await Job.create({
    organizationId: org._id,
    title: 'Lead Frontend UI/UX Architect',
    department: 'Design & Engineering',
    location: 'San Francisco / Hybrid',
    employmentType: 'FULL_TIME',
    status: 'OPEN',
    openingsCount: 2,
    hiringManagerId: interviewer2._id,
    recruiterId: recruiter._id,
    description: 'Lead the frontend design system, accessible UI component library, and state management.',
    requirements: ['6+ years React / TypeScript', 'Tailwind & Design Systems', 'Web Performance'],
  });

  const round1 = await InterviewRound.create({
    organizationId: org._id,
    jobId: job1._id,
    name: '1. Technical Coding & Architecture',
    order: 1,
    type: 'TECHNICAL',
    durationMinutes: 60,
    requiredInterviewerCount: 1,
    qualifiedInterviewerPool: [interviewer1._id, interviewer2._id],
    competencies: [
      { name: 'Algorithms & State Management', description: 'Evaluates time/space complexity and state design', weight: 1 },
      { name: 'Code Modularity & Best Practices', description: 'Readability, clean design, edge cases', weight: 1 },
    ],
  });

  const round2 = await InterviewRound.create({
    organizationId: org._id,
    jobId: job1._id,
    name: '2. System Design & Scalability Panel',
    order: 2,
    type: 'SYSTEM_DESIGN',
    durationMinutes: 60,
    requiredInterviewerCount: 2,
    qualifiedInterviewerPool: [interviewer1._id, interviewer2._id],
    competencies: [
      { name: 'Distributed Caching & Partitioning', description: 'Evaluates concurrency, caching, and database isolation', weight: 1 },
      { name: 'Resilience & Failure Recovery', description: 'Assesses fault tolerance and retry strategies', weight: 1 },
    ],
  });

  const roundJob2 = await InterviewRound.create({
    organizationId: org._id,
    jobId: job2._id,
    name: '1. Systems Architecture & Scalability',
    order: 1,
    type: 'SYSTEM_DESIGN',
    durationMinutes: 60,
    requiredInterviewerCount: 2,
    qualifiedInterviewerPool: [interviewer1._id, interviewer2._id],
    competencies: [
      { name: 'Distributed Consensus & Replication', description: 'Raft, Paxos, and partition tolerance', weight: 1 },
      { name: 'High Throughput Caching', description: 'Redis cluster and memory optimization', weight: 1 },
    ],
  });

  const roundJob3 = await InterviewRound.create({
    organizationId: org._id,
    jobId: job3._id,
    name: '1. UI/UX Architecture & React Deep Dive',
    order: 1,
    type: 'TECHNICAL',
    durationMinutes: 60,
    requiredInterviewerCount: 1,
    qualifiedInterviewerPool: [interviewer2._id],
    competencies: [
      { name: 'Frontend Architecture & Rendering Optimization', description: 'State management, CSS layout, accessibility', weight: 1 },
      { name: 'Component System Design', description: 'Reusability, design system consistency, ergonomics', weight: 1 },
    ],
  });

  const cand1 = await Candidate.create({
    organizationId: org._id,
    firstName: 'Emily',
    lastName: 'Zhang',
    email: 'emily.zhang@example.com',
    phone: '+1 415-555-0192',
    currentCompany: 'Stripe',
    currentTitle: 'Senior Software Engineer',
    experienceYears: 6,
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'GraphQL', 'AWS'],
    appliedJobId: job1._id,
    stage: 'INTERVIEWING',
    resumeUrl: 'https://example.com/resumes/emily-zhang.pdf',
    timezone: 'America/Los_Angeles',
    notes: 'Exceptional background in real-time billing and dashboard architectures.',
  });

  const cand2 = await Candidate.create({
    organizationId: org._id,
    firstName: 'Jordan',
    lastName: 'Miller',
    email: 'jordan.miller@example.com',
    phone: '+1 212-555-0143',
    currentCompany: 'Datadog',
    currentTitle: 'Staff Backend Engineer',
    experienceYears: 9,
    skills: ['Go', 'Distributed Systems', 'Kafka', 'Redis', 'Kubernetes'],
    appliedJobId: job2._id,
    stage: 'INTERVIEWING',
    resumeUrl: 'https://example.com/resumes/jordan-miller.pdf',
    timezone: 'America/New_York',
    notes: 'Top tier systems architect.',
  });

  const cand3 = await Candidate.create({
    organizationId: org._id,
    firstName: 'Priya',
    lastName: 'Nair',
    email: 'priya.nair@example.com',
    phone: '+1 650-555-0811',
    currentCompany: 'Airbnb',
    currentTitle: 'Lead UI Engineer',
    experienceYears: 7,
    skills: ['React', 'Tailwind', 'Design Systems', 'Microfrontends', 'State Management'],
    appliedJobId: job3._id,
    stage: 'SCREENING',
    resumeUrl: 'https://example.com/resumes/priya-nair.pdf',
    timezone: 'America/Los_Angeles',
  });

  const cand4 = await Candidate.create({
    organizationId: org._id,
    firstName: 'Alex',
    lastName: 'Chen',
    email: 'alex.chen@example.com',
    phone: '+1 206-555-0188',
    currentCompany: 'Amazon Web Services',
    currentTitle: 'Senior Cloud Engineer',
    experienceYears: 8,
    skills: ['AWS', 'Distributed Systems', 'Node.js', 'Docker', 'DynamoDB'],
    appliedJobId: job1._id,
    stage: 'OFFER',
    resumeUrl: 'https://example.com/resumes/alex-chen.pdf',
    timezone: 'America/Los_Angeles',
  });

  const now = new Date();
  const tomorrow10am = new Date(now);
  tomorrow10am.setDate(tomorrow10am.getDate() + 1);
  tomorrow10am.setHours(10, 0, 0, 0);

  const tomorrow11am = new Date(tomorrow10am);
  tomorrow11am.setHours(11, 0, 0, 0);

  // Scheduled upcoming interview
  await Interview.create({
    organizationId: org._id,
    candidateId: cand1._id,
    jobId: job1._id,
    roundId: round1._id,
    interviewers: [
      { userId: interviewer1._id, responseStatus: 'ACCEPTED', isLead: true },
      { userId: interviewer2._id, responseStatus: 'ACCEPTED', isLead: false },
    ],
    startTime: tomorrow10am,
    endTime: tomorrow11am,
    timezone: 'America/New_York',
    status: 'SCHEDULED',
    meetingType: 'GOOGLE_MEET',
    meetingUrl: 'https://meet.google.com/hsy-qwer-zxc',
    calendarEventId: 'cal_seed_001',
    version: 0,
  });

  // Completed interview yesterday with PENDING FEEDBACK (Interviewer 1 submitted, Interviewer 2 draft)
  const yesterday2pm = new Date(now);
  yesterday2pm.setDate(yesterday2pm.getDate() - 1);
  yesterday2pm.setHours(14, 0, 0, 0);

  const yesterday3pm = new Date(yesterday2pm);
  yesterday3pm.setHours(15, 0, 0, 0);

  const interviewYesterday = await Interview.create({
    organizationId: org._id,
    candidateId: cand2._id,
    jobId: job2._id,
    roundId: roundJob2._id,
    interviewers: [
      { userId: interviewer1._id, responseStatus: 'ACCEPTED', isLead: true },
      { userId: interviewer2._id, responseStatus: 'ACCEPTED', isLead: false },
    ],
    startTime: yesterday2pm,
    endTime: yesterday3pm,
    timezone: 'America/New_York',
    status: 'COMPLETED',
    meetingType: 'GOOGLE_MEET',
    meetingUrl: 'https://meet.google.com/xyz-uvwx-rst',
    calendarEventId: 'cal_seed_002',
    version: 1,
  });

  // Interviewer 1 submitted scorecard
  await Scorecard.create({
    organizationId: org._id,
    interviewId: interviewYesterday._id,
    candidateId: cand2._id,
    interviewerId: interviewer1._id,
    ratings: [
      { name: 'Distributed Consensus & Replication', rating: 5, notes: 'Superb grasp of partition tolerance and vector clocks.' },
      { name: 'High Throughput Caching', rating: 5, notes: 'Solid design with idempotent replay queues.' },
    ],
    overallRecommendation: 'STRONG_YES',
    summaryFeedback: 'Exceptional systems architect. Strong clear communication and immediate cultural fit.',
    status: 'SUBMITTED',
    submittedAt: new Date(yesterday3pm.getTime() + 25 * 60 * 1000),
  });

  // Interviewer 2 draft scorecard (pending feedback!)
  await Scorecard.create({
    organizationId: org._id,
    interviewId: interviewYesterday._id,
    candidateId: cand2._id,
    interviewerId: interviewer2._id,
    ratings: [
      { name: 'Distributed Consensus & Replication', rating: 4, notes: 'Good theoretical discussion.' },
    ],
    overallRecommendation: 'YES',
    summaryFeedback: 'Drafting notes on resilience and caching layers...',
    status: 'DRAFT',
  });

  logger.info('✅ Auto-seeding completed successfully!');
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
    logger.info('MongoDB disconnected.');
  } catch (error: any) {
    logger.error('Error disconnecting MongoDB:', error);
  }
}
