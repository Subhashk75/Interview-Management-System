import { Router } from 'express';
import {
  getDashboardStats,
  getAdminStats,
  getRecruiterStats,
  getInterviewerStats,
  getHiringManagerStats,
  getCandidateStats,
} from './dashboard.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Dynamic Role-Aware Dashboard
router.get('/stats', getDashboardStats);

// Explicit Role Endpoints
router.get('/admin', getAdminStats);
router.get('/recruiter', getRecruiterStats);
router.get('/interviewer', getInterviewerStats);
router.get('/hiring-manager', getHiringManagerStats);
router.get('/candidate', getCandidateStats);

export default router;
