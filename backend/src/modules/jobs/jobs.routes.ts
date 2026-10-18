import { Router } from 'express';
import { getJobs, createJob, getRoundsByJobId } from './jobs.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getJobs);
router.post('/', createJob);
router.get('/:jobId/rounds', getRoundsByJobId);

export default router;
