import { Router } from 'express';
import {
  getCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  updateCandidateStage,
  bulkActionCandidates,
  exportCandidatesCsv,
  deleteCandidate,
} from './candidates.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getCandidates);
router.post('/', createCandidate);
router.post('/bulk-action', bulkActionCandidates);
router.get('/export', exportCandidatesCsv);
router.get('/:id', getCandidateById);
router.patch('/:id', updateCandidate);
router.patch('/:id/stage', updateCandidateStage);
router.delete('/:id', deleteCandidate);

export default router;
