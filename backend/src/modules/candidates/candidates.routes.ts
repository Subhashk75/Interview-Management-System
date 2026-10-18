import { Router } from 'express';
import {
  getCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate,
} from './candidates.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getCandidates);
router.post('/', createCandidate);
router.get('/:id', getCandidateById);
router.patch('/:id', updateCandidate);
router.delete('/:id', deleteCandidate);

export default router;
