import { Router } from 'express';
import {
  generateSlots,
  bookInterview,
  getInterviews,
  getInterviewById,
  rescheduleInterview,
  cancelInterview,
  createInvitation,
  getPublicInvitation,
  bookPublicInvitation,
} from './scheduling.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

// Public Candidate Self-Scheduling routes (unauthenticated)
router.get('/public/invitations/:token', getPublicInvitation);
router.post('/public/invitations/:token/book', bookPublicInvitation);

// Protected routes (require valid JWT)
router.use(authenticate);

router.post('/slots', generateSlots);
router.post('/book', bookInterview);
router.post('/invitations', createInvitation);
router.get('/', getInterviews);
router.get('/:id', getInterviewById);
router.patch('/:id/reschedule', rescheduleInterview);
router.post('/:id/cancel', cancelInterview);

export default router;
