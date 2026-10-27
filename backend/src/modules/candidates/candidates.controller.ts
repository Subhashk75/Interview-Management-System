import { Response, NextFunction } from 'express';
import { Candidate } from '../../models/Candidate.js';
import { Interview } from '../../models/Interview.js';
import { AuditLog } from '../../models/AuditLog.js';
import { AuthRequest } from '../../middleware/auth.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/appError.js';

const VALID_STAGES = ['APPLIED', 'SCREENING', 'INTERVIEWING', 'OFFER', 'HIRED', 'REJECTED'] as const;

export async function getCandidates(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { search, stage, appliedJobId, isArchived, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = { organizationId: req.organizationId };
    if (isArchived !== undefined) {
      filter.isArchived = isArchived === 'true';
    } else {
      filter.isArchived = false;
    }

    if (stage && VALID_STAGES.includes(stage as any)) {
      filter.stage = stage;
    }

    if (appliedJobId) {
      filter.appliedJobId = appliedJobId;
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { currentCompany: { $regex: search, $options: 'i' } },
      ];
    }

    const [candidates, total] = await Promise.all([
      Candidate.find(filter)
        .populate('appliedJobId', 'title department location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Candidate.countDocuments(filter),
    ]);

    sendSuccess(
      res,
      candidates,
      'Candidates fetched successfully',
      200,
      { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    );
  } catch (error) {
    next(error);
  }
}

export async function getCandidateById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const candidate = await Candidate.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    }).populate('appliedJobId', 'title department location openingsCount');

    if (!candidate) {
      throw new AppError('Candidate not found.', 404, 'NOT_FOUND');
    }

    const [interviews, auditLogs] = await Promise.all([
      Interview.find({ candidateId: candidate._id })
        .populate('jobId', 'title department')
        .populate('roundId', 'name order type durationMinutes competencies')
        .populate('interviewers.userId', 'firstName lastName email title avatarUrl')
        .sort({ startTime: 1 }),
      AuditLog.find({
        organizationId: req.organizationId,
        entityType: 'Candidate',
        entityId: candidate._id.toString(),
      })
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 }),
    ]);

    sendSuccess(
      res,
      { candidate, interviews, timeline: auditLogs },
      'Candidate details with interview history and activity timeline'
    );
  } catch (error) {
    next(error);
  }
}

export async function createCandidate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      currentCompany,
      currentTitle,
      experienceYears,
      skills,
      appliedJobId,
      stage,
      resumeUrl,
      linkedinUrl,
      timezone,
      notes,
    } = req.body;

    const existing = await Candidate.findOne({
      organizationId: req.organizationId,
      email: email.toLowerCase(),
    });
    if (existing) {
      throw new AppError('A candidate with this email already exists in your organization.', 409, 'DUPLICATE_CANDIDATE');
    }

    const initialStage = stage && VALID_STAGES.includes(stage) ? stage : 'INTERVIEWING';

    const candidate = await Candidate.create({
      organizationId: req.organizationId,
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      currentCompany,
      currentTitle,
      experienceYears,
      skills: Array.isArray(skills) ? skills : [],
      appliedJobId: appliedJobId || undefined,
      stage: initialStage,
      resumeUrl,
      linkedinUrl,
      timezone: timezone || 'UTC',
      notes,
    });

    // Record creation in audit log
    await AuditLog.create({
      organizationId: req.organizationId,
      userId: req.userId,
      action: 'CANDIDATE_CREATED',
      entityType: 'Candidate',
      entityId: candidate._id.toString(),
      details: {
        name: `${candidate.firstName} ${candidate.lastName}`,
        email: candidate.email,
        initialStage,
        appliedJobId,
      },
    });

    sendSuccess(res, candidate, 'Candidate created successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateCandidate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const oldCandidate = await Candidate.findOne({ _id: req.params.id, organizationId: req.organizationId });
    if (!oldCandidate) {
      throw new AppError('Candidate not found.', 404, 'NOT_FOUND');
    }

    const candidate = await Candidate.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    // If stage was changed via general update, record audit log
    if (req.body.stage && req.body.stage !== oldCandidate.stage) {
      await AuditLog.create({
        organizationId: req.organizationId,
        userId: req.userId,
        action: 'STAGE_CHANGED',
        entityType: 'Candidate',
        entityId: oldCandidate._id.toString(),
        details: {
          previousStage: oldCandidate.stage,
          newStage: req.body.stage,
        },
      });
    }

    sendSuccess(res, candidate, 'Candidate updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function updateCandidateStage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { stage, reason } = req.body;
    if (!stage || !VALID_STAGES.includes(stage)) {
      throw new AppError(`Invalid pipeline stage. Must be one of: ${VALID_STAGES.join(', ')}`, 400, 'INVALID_STAGE');
    }

    const candidate = await Candidate.findOne({ _id: req.params.id, organizationId: req.organizationId });
    if (!candidate) {
      throw new AppError('Candidate not found.', 404, 'NOT_FOUND');
    }

    const previousStage = candidate.stage;
    candidate.stage = stage;
    await candidate.save();

    // Record audit event
    await AuditLog.create({
      organizationId: req.organizationId,
      userId: req.userId,
      action: 'STAGE_CHANGED',
      entityType: 'Candidate',
      entityId: candidate._id.toString(),
      details: {
        previousStage,
        newStage: stage,
        reason: reason || 'Pipeline progression',
      },
    });

    sendSuccess(
      res,
      { candidateId: candidate._id, previousStage, newStage: candidate.stage },
      `Candidate moved from ${previousStage} to ${stage}`
    );
  } catch (error) {
    next(error);
  }
}

export async function bulkActionCandidates(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { candidateIds, action, stage, reason } = req.body;

    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      throw new AppError('Candidate IDs array is required.', 400, 'MISSING_CANDIDATE_IDS');
    }

    if (!['SET_STAGE', 'ARCHIVE'].includes(action)) {
      throw new AppError('Action must be either SET_STAGE or ARCHIVE.', 400, 'INVALID_BULK_ACTION');
    }

    if (action === 'SET_STAGE') {
      if (!stage || !VALID_STAGES.includes(stage)) {
        throw new AppError(`Valid target stage is required: ${VALID_STAGES.join(', ')}`, 400, 'INVALID_STAGE');
      }

      const result = await Candidate.updateMany(
        { _id: { $in: candidateIds }, organizationId: req.organizationId },
        { $set: { stage } }
      );

      // Record batch audit log
      const auditEntries = candidateIds.map((id: string) => ({
        organizationId: req.organizationId,
        userId: req.userId,
        action: 'BULK_STAGE_CHANGED',
        entityType: 'Candidate',
        entityId: id.toString(),
        details: { targetStage: stage, reason: reason || 'Bulk pipeline action' },
      }));
      await AuditLog.insertMany(auditEntries);

      sendSuccess(res, { affectedCount: result.modifiedCount, stage }, `Successfully moved ${result.modifiedCount} candidates to ${stage}`);
      return;
    }

    if (action === 'ARCHIVE') {
      const result = await Candidate.updateMany(
        { _id: { $in: candidateIds }, organizationId: req.organizationId },
        { $set: { isArchived: true } }
      );

      sendSuccess(res, { affectedCount: result.modifiedCount }, `Successfully archived ${result.modifiedCount} candidates`);
      return;
    }
  } catch (error) {
    next(error);
  }
}

export async function exportCandidatesCsv(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const candidates = await Candidate.find({ organizationId: req.organizationId, isArchived: false })
      .populate('appliedJobId', 'title department')
      .sort({ createdAt: -1 });

    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Title', 'Experience (Years)', 'Applied Role', 'Department', 'Pipeline Stage', 'Added Date'];
    
    const rows = candidates.map((c) => {
      const job = c.appliedJobId as any;
      return [
        `"${(c.firstName || '').replace(/"/g, '""')}"`,
        `"${(c.lastName || '').replace(/"/g, '""')}"`,
        `"${(c.email || '').replace(/"/g, '""')}"`,
        `"${(c.phone || '').replace(/"/g, '""')}"`,
        `"${(c.currentCompany || '').replace(/"/g, '""')}"`,
        `"${(c.currentTitle || '').replace(/"/g, '""')}"`,
        c.experienceYears || 0,
        `"${(job?.title || 'Unassigned').replace(/"/g, '""')}"`,
        `"${(job?.department || 'N/A').replace(/"/g, '""')}"`,
        `"${c.stage || 'INTERVIEWING'}"`,
        `"${new Date(c.createdAt).toISOString().split('T')[0]}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="candidates_roster.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

export async function deleteCandidate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const candidate = await Candidate.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
      { $set: { isArchived: true } },
      { new: true }
    );
    if (!candidate) {
      throw new AppError('Candidate not found.', 404, 'NOT_FOUND');
    }

    await AuditLog.create({
      organizationId: req.organizationId,
      userId: req.userId,
      action: 'CANDIDATE_ARCHIVED',
      entityType: 'Candidate',
      entityId: candidate._id.toString(),
      details: { email: candidate.email },
    });

    sendSuccess(res, { id: req.params.id }, 'Candidate archived successfully');
  } catch (error) {
    next(error);
  }
}
