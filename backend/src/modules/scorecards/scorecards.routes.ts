import { Router } from 'express';
import { submitScorecard, getInterviewScorecards } from './scorecards.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', submitScorecard);
router.get('/interview/:interviewId', getInterviewScorecards);

export default router;
