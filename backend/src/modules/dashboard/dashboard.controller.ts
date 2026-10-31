import { Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service.js';
import { AuthRequest } from '../../middleware/auth.js';
import { sendSuccess } from '../../utils/response.js';
import { User } from '../../models/User.js';

export async function getDashboardStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const userId = req.userId!;
    const role = req.userRole!;

    // Resolve requested role override if query parameter provided (e.g. for previewing in dev or demo switcher)
    const targetRole = (req.query.role as string) || role;

    let result: any;
    if (targetRole === 'ADMIN') {
      result = await dashboardService.getAdminDashboard(orgId);
    } else if (targetRole === 'INTERVIEWER') {
      result = await dashboardService.getInterviewerDashboard(orgId, userId);
    } else if (targetRole === 'HIRING_MANAGER' || targetRole === 'MANAGER') {
      result = await dashboardService.getHiringManagerDashboard(orgId, userId);
    } else if (targetRole === 'CANDIDATE') {
      const user = await User.findById(userId);
      result = await dashboardService.getCandidateDashboard(orgId, user?.email || '');
    } else {
      // Default to HR / RECRUITER
      result = await dashboardService.getRecruiterDashboard(orgId);
    }

    sendSuccess(res, result, `${targetRole} dashboard statistics fetched successfully`);
  } catch (error) {
    next(error);
  }
}

export async function getAdminStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await dashboardService.getAdminDashboard(req.organizationId!);
    sendSuccess(res, result, 'Admin dashboard statistics fetched successfully');
  } catch (error) {
    next(error);
  }
}

export async function getRecruiterStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await dashboardService.getRecruiterDashboard(req.organizationId!);
    sendSuccess(res, result, 'Recruiter dashboard statistics fetched successfully');
  } catch (error) {
    next(error);
  }
}

export async function getInterviewerStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await dashboardService.getInterviewerDashboard(req.organizationId!, req.userId!);
    sendSuccess(res, result, 'Interviewer dashboard statistics fetched successfully');
  } catch (error) {
    next(error);
  }
}

export async function getHiringManagerStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await dashboardService.getHiringManagerDashboard(req.organizationId!, req.userId!);
    sendSuccess(res, result, 'Hiring Manager dashboard statistics fetched successfully');
  } catch (error) {
    next(error);
  }
}

export async function getCandidateStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.userId);
    const result = await dashboardService.getCandidateDashboard(req.organizationId!, user?.email || '');
    sendSuccess(res, result, 'Candidate dashboard statistics fetched successfully');
  } catch (error) {
    next(error);
  }
}
