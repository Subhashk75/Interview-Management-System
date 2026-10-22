import { Router } from 'express';
import {
  login,
  register,
  verifyOtp,
  resendOtp,
  getMe,
  getInterviewers,
  adminGetUsers,
  adminCreateHr,
  adminUpdateRole,
  adminToggleStatus,
} from './auth.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { emailService } from '../notifications/email.service.js';
import { sendSuccess } from '../../utils/response.js';

const router = Router();

// Public auth routes
router.post('/login', login);
router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

// Authenticated user routes
router.get('/me', authenticate, getMe);
router.get('/interviewers', authenticate, getInterviewers);
router.get('/email-logs', authenticate, (_req, res) => {
  sendSuccess(res, emailService.getRecentLogs(), 'Recent email logs');
});

// Admin Access for HR Management
router.get('/admin/users', authenticate, authorize('ADMIN'), adminGetUsers);
router.post('/admin/hr', authenticate, authorize('ADMIN'), adminCreateHr);
router.patch('/admin/users/:id/role', authenticate, authorize('ADMIN'), adminUpdateRole);
router.patch('/admin/users/:id/status', authenticate, authorize('ADMIN'), adminToggleStatus);

export default router;
