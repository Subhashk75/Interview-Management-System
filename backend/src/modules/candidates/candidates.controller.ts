import { Response, NextFunction } from 'express';
import { Candidate } from '../../models/Candidate.js';
import { Interview } from '../../models/Interview.js';
import { AuthRequest } from '../../middleware/auth.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/appError.js';

export async function getCandidates(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { search, isArchived, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = { organizationId: req.organizationId };
    if (isArchived !== undefined) {
      filter.isArchived = isArchived === 'true';
    } else {
      filter.isArchived = false;
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
    });
    if (!candidate) {
      throw new AppError('Candidate not found.', 404, 'NOT_FOUND');
    }

    const interviews = await Interview.find({ candidateId: candidate._id })
      .populate('jobId', 'title department')
      .populate('roundId', 'name order type')
      .populate('interviewers.userId', 'firstName lastName email title avatarUrl')
      .sort({ startTime: 1 });

    sendSuccess(res, { candidate, interviews }, 'Candidate details with interview history');
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
      stage: stage || 'INTERVIEWING',
      resumeUrl,
      linkedinUrl,
      timezone: timezone || 'UTC',
      notes,
    });

    sendSuccess(res, candidate, 'Candidate created successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateCandidate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const candidate = await Candidate.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!candidate) {
      throw new AppError('Candidate not found.', 404, 'NOT_FOUND');
    }
    sendSuccess(res, candidate, 'Candidate updated successfully');
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
    sendSuccess(res, { id: req.params.id }, 'Candidate archived successfully');
  } catch (error) {
    next(error);
  }
}
