import { Response, NextFunction } from 'express';
import { Job } from '../../models/Job.js';
import { InterviewRound } from '../../models/InterviewRound.js';
import { AuthRequest } from '../../middleware/auth.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/appError.js';

export async function getJobs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const jobs = await Job.find({ organizationId: req.organizationId })
      .populate('hiringManagerId', 'firstName lastName email title')
      .populate('recruiterId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const jobsWithRounds = await Promise.all(
      jobs.map(async (job) => {
        const rounds = await InterviewRound.find({ jobId: job._id }).sort({ order: 1 });
        return {
          ...job.toObject(),
          rounds,
        };
      })
    );

    sendSuccess(res, jobsWithRounds, 'Jobs with pipeline rounds fetched');
  } catch (error) {
    next(error);
  }
}

export async function createJob(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, department, location, employmentType, hiringManagerId, description, requirements, rounds } = req.body;

    const job = await Job.create({
      organizationId: req.organizationId,
      title,
      department,
      location: location || 'Remote',
      employmentType: employmentType || 'FULL_TIME',
      hiringManagerId: hiringManagerId || req.userId,
      recruiterId: req.userId,
      description,
      requirements,
    });

    // Create default or custom rounds
    const defaultRounds = rounds || [
      { name: 'Recruiter Screening', order: 1, type: 'SCREEN', durationMinutes: 30, requiredInterviewerCount: 1 },
      { name: 'Technical Coding', order: 2, type: 'TECHNICAL', durationMinutes: 60, requiredInterviewerCount: 1 },
      { name: 'System Design', order: 3, type: 'SYSTEM_DESIGN', durationMinutes: 60, requiredInterviewerCount: 2 },
      { name: 'Behavioral & Culture', order: 4, type: 'BEHAVIORAL', durationMinutes: 45, requiredInterviewerCount: 1 },
    ];

    const createdRounds = await Promise.all(
      defaultRounds.map((r: any, idx: number) =>
        InterviewRound.create({
          organizationId: req.organizationId,
          jobId: job._id,
          name: r.name,
          order: r.order || idx + 1,
          type: r.type || 'TECHNICAL',
          durationMinutes: r.durationMinutes || 60,
          requiredInterviewerCount: r.requiredInterviewerCount || 1,
          competencies: r.competencies || [
            { name: 'Core Competency', description: 'Evaluates fundamental problem-solving and domain mastery', weight: 1 },
            { name: 'Communication & Collaboration', description: 'Evaluates articulateness, teamwork, and structure', weight: 1 },
          ],
        })
      )
    );

    sendSuccess(res, { job, rounds: createdRounds }, 'Job created with interview rounds', 201);
  } catch (error) {
    next(error);
  }
}

export async function getRoundsByJobId(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const rounds = await InterviewRound.find({
      jobId: req.params.jobId,
      organizationId: req.organizationId,
    }).sort({ order: 1 });
    sendSuccess(res, rounds, 'Interview rounds for job');
  } catch (error) {
    next(error);
  }
}
