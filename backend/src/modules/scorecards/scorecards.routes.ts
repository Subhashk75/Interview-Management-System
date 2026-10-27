import { Router } from 'express';
import { submitScorecard, getInterviewScorecards, unlockScorecard, getDebriefPacket } from './scorecards.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', submitScorecard);
router.get('/interview/:interviewId', getInterviewScorecards);
router.get('/interview/:interviewId/debrief', getDebriefPacket);
router.patch('/:id/unlock', authorize('ADMIN', 'RECRUITER'), unlockScorecard);

export default router;
