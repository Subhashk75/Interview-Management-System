import { Router } from 'express';
import { getDashboardStats } from './dashboard.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/stats', getDashboardStats);

export default router;
