import { Router } from 'express';
import {
  generateSlots,
  bookInterview,
  getInterviews,
  getInterviewById,
  rescheduleInterview,
  cancelInterview,
} from './scheduling.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/slots', generateSlots);
router.post('/book', bookInterview);
router.get('/', getInterviews);
router.get('/:id', getInterviewById);
router.patch('/:id/reschedule', rescheduleInterview);
router.post('/:id/cancel', cancelInterview);

export default router;
