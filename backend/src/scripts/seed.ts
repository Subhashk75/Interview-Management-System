import mongoose from 'mongoose';
import { ENV } from '../config/env.js';
import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';
import { Candidate } from '../models/Candidate.js';
import { Job } from '../models/Job.js';
import { InterviewRound } from '../models/InterviewRound.js';
import { Interview } from '../models/Interview.js';
import { Scorecard } from '../models/Scorecard.js';
import { logger } from '../utils/logger.js';

async function seedDatabase() {
  try {
    logger.info('Connecting to MongoDB for seeding...');
    await mongoose.connect(ENV.MONGODB_URI);

    logger.info('Clearing old data collections...');
    await Promise.all([
      Organization.deleteMany({}),
      User.deleteMany({}),
      Candidate.deleteMany({}),
      Job.deleteMany({}),
      InterviewRound.deleteMany({}),
      Interview.deleteMany({}),
      Scorecard.deleteMany({}),
    ]);

    // 1. Create Organization
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
    logger.info(`Organization created: ${org.name}`);

    // 2. Create Users (Admin, Recruiter, Interviewers)
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
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    });

    const interviewer3 = await User.create({
      organizationId: org._id,
      firstName: 'Marcus',
      lastName: 'Vance',
      email: 'marcus.vance@acme.com',
      password: 'Password123!',
      role: 'HIRING_MANAGER',
      title: 'Director of Engineering',
      department: 'Core Infrastructure',
      skills: ['Behavioral', 'Leadership', 'Strategic Architecture', 'Cross-Functional Collaboration'],
      weeklyCapacityHours: 3,
      dailyInterviewLimit: 1,
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    });

    const candidateUser = await User.create({
      organizationId: org._id,
      firstName: 'Emily',
      lastName: 'Zhang',
      email: 'emily.zhang@example.com',
      password: 'Password123!',
      role: 'CANDIDATE',
      title: 'Senior Software Engineer',
      department: 'Product Engineering',
      phone: '+1 415-555-0192',
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'GraphQL', 'AWS'],
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    });

    logger.info('Created 5 core users.');

    // 3. Create Jobs
    const job1 = await Job.create({
      organizationId: org._id,
      title: 'Senior Full Stack Engineer (MERN / Distributed)',
      department: 'Product Engineering',
      location: 'New York / Hybrid',
      employmentType: 'FULL_TIME',
      status: 'OPEN',
      hiringManagerId: interviewer3._id,
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
      hiringManagerId: interviewer1._id,
      recruiterId: recruiter._id,
      description: 'Architect next-generation high throughput real-time availability and calendar synchronization engines.',
      requirements: ['8+ years distributed backends', 'Redis locking & ACID transactions', 'Cloud native'],
    });

    // 4. Create Interview Rounds for Job 1
    const round1 = await InterviewRound.create({
      organizationId: org._id,
      jobId: job1._id,
      name: '1. Recruiter Screen',
      order: 1,
      type: 'SCREEN',
      durationMinutes: 30,
      requiredInterviewerCount: 1,
      qualifiedInterviewerPool: [recruiter._id],
      competencies: [
        { name: 'Role Motivation & Career Trajectory', description: 'Assesses career goals and alignment with Acme', weight: 1 },
        { name: 'Core Communication', description: 'Assesses clarity, structure, and professionalism', weight: 1 },
      ],
    });

    const round2 = await InterviewRound.create({
      organizationId: org._id,
      jobId: job1._id,
      name: '2. Technical Coding & System Architecture',
      order: 2,
      type: 'TECHNICAL',
      durationMinutes: 60,
      requiredInterviewerCount: 1,
      qualifiedInterviewerPool: [interviewer1._id, interviewer2._id],
      competencies: [
        { name: 'Algorithms & Data Modeling', description: 'Evaluates time/space complexity and state design', weight: 1 },
        { name: 'Production Code Quality', description: 'Modularity, readability, edge-case testing', weight: 1 },
      ],
    });

    const round3 = await InterviewRound.create({
      organizationId: org._id,
      jobId: job1._id,
      name: '3. System Design & Scalability Panel',
      order: 3,
      type: 'SYSTEM_DESIGN',
      durationMinutes: 60,
      requiredInterviewerCount: 2,
      qualifiedInterviewerPool: [interviewer1._id, interviewer2._id],
      competencies: [
        { name: 'Distributed Architecture & Trade-offs', description: 'Evaluates caching, consistency, and database partitioning', weight: 1 },
        { name: 'Failure Recovery & Resiliency', description: 'Assesses fault tolerance and observability', weight: 1 },
      ],
    });

    const round4 = await InterviewRound.create({
      organizationId: org._id,
      jobId: job1._id,
      name: '4. Executive Leadership & Values',
      order: 4,
      type: 'BEHAVIORAL',
      durationMinutes: 45,
      requiredInterviewerCount: 1,
      qualifiedInterviewerPool: [interviewer3._id, admin._id],
      competencies: [
        { name: 'Conflict Resolution & Collaboration', description: 'Handling disagreements and mentoring peers', weight: 1 },
        { name: 'Ownership & Initiative', description: 'Bias for action and driving ambiguous projects to delivery', weight: 1 },
      ],
    });

    logger.info('Created Jobs and Interview Rounds.');

    // 5. Create Candidates
    const candidate1 = await Candidate.create({
      organizationId: org._id,
      firstName: 'Emily',
      lastName: 'Zhang',
      email: 'emily.zhang@example.com',
      phone: '+1 415-555-0192',
      currentCompany: 'Stripe',
      currentTitle: 'Senior Software Engineer',
      experienceYears: 6,
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'GraphQL', 'AWS'],
      resumeUrl: 'https://example.com/resumes/emily-zhang.pdf',
      timezone: 'America/Los_Angeles',
      notes: 'Exceptional background in real-time billing and dashboard architectures.',
    });

    const candidate2 = await Candidate.create({
      organizationId: org._id,
      firstName: 'Jordan',
      lastName: 'Miller',
      email: 'jordan.miller@example.com',
      phone: '+1 212-555-0143',
      currentCompany: 'Datadog',
      currentTitle: 'Staff Backend Engineer',
      experienceYears: 9,
      skills: ['Go', 'Distributed Systems', 'Kafka', 'Redis', 'Kubernetes'],
      resumeUrl: 'https://example.com/resumes/jordan-miller.pdf',
      timezone: 'America/New_York',
      notes: 'Top tier systems architect. Looking for rapid advancement to Staff/Principal.',
    });

    const candidate3 = await Candidate.create({
      organizationId: org._id,
      firstName: 'Priya',
      lastName: 'Nair',
      email: 'priya.nair@example.com',
      phone: '+1 650-555-0811',
      currentCompany: 'Airbnb',
      currentTitle: 'Lead UI Engineer',
      experienceYears: 7,
      skills: ['React', 'Tailwind', 'Design Systems', 'Microfrontends', 'State Management'],
      resumeUrl: 'https://example.com/resumes/priya-nair.pdf',
      timezone: 'America/Los_Angeles',
    });

    logger.info('Created 3 sample candidates.');

    // 6. Create Scheduled & Completed Interviews
    const now = new Date();
    const tomorrow10am = new Date(now);
    tomorrow10am.setDate(tomorrow10am.getDate() + 1);
    tomorrow10am.setHours(10, 0, 0, 0);

    const tomorrow11am = new Date(tomorrow10am);
    tomorrow11am.setHours(11, 0, 0, 0);

    const interview1 = await Interview.create({
      organizationId: org._id,
      candidateId: candidate1._id,
      jobId: job1._id,
      roundId: round2._id,
      interviewers: [
        { userId: interviewer1._id, responseStatus: 'ACCEPTED', isLead: true },
        { userId: interviewer2._id, responseStatus: 'ACCEPTED', isLead: false },
      ],
      startTime: tomorrow10am,
      endTime: tomorrow11am,
      timezone: 'America/New_York',
      status: 'SCHEDULED',
      meetingType: 'GOOGLE_MEET',
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      calendarEventId: 'cal_seed_001',
      version: 0,
    });

    // Completed Interview with Blinded Scorecards
    const yesterday2pm = new Date(now);
    yesterday2pm.setDate(yesterday2pm.getDate() - 1);
    yesterday2pm.setHours(14, 0, 0, 0);

    const yesterday3pm = new Date(yesterday2pm);
    yesterday3pm.setHours(15, 0, 0, 0);

    const interview2 = await Interview.create({
      organizationId: org._id,
      candidateId: candidate2._id,
      jobId: job1._id,
      roundId: round3._id,
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

    // Interviewer 1 has submitted their scorecard
    await Scorecard.create({
      organizationId: org._id,
      interviewId: interview2._id,
      candidateId: candidate2._id,
      interviewerId: interviewer1._id,
      ratings: [
        { name: 'Distributed Architecture & Trade-offs', rating: 5, notes: 'Superb grasp of partition tolerance and vector clocks.' },
        { name: 'Failure Recovery & Resiliency', rating: 4, notes: 'Solid design with idempotent replay queues.' },
      ],
      overallRecommendation: 'STRONG_YES',
      summaryFeedback: 'Exceptional systems architect. Strong clear communication and immediate cultural fit.',
      status: 'SUBMITTED',
      submittedAt: new Date(yesterday3pm.getTime() + 15 * 60 * 1000),
    });

    // Interviewer 2 is still in DRAFT (demonstrating the Anti-bias blinding feature!)
    await Scorecard.create({
      organizationId: org._id,
      interviewId: interview2._id,
      candidateId: candidate2._id,
      interviewerId: interviewer2._id,
      ratings: [
        { name: 'Distributed Architecture & Trade-offs', rating: 4, notes: 'Good discussion on caching layers.' },
      ],
      overallRecommendation: 'YES',
      summaryFeedback: 'Drafting notes on frontend state cache sync...',
      status: 'DRAFT',
    });

    logger.info('✅ Successfully seeded database with realistic sample enterprise dataset!');
    logger.info('===============================================================');
    logger.info('Credentials for testing:');
    logger.info('Admin:        admin@acme.com       / Password123!');
    logger.info('Recruiter:    recruiter@acme.com   / Password123!');
    logger.info('Interviewer:  david.kim@acme.com   / Password123!');
    logger.info('Interviewer:  elena.rostova@acme.com / Password123!');
    logger.info('===============================================================');

    process.exit(0);
  } catch (error: any) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
