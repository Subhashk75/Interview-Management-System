import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes.js';
import candidateRoutes from './modules/candidates/candidates.routes.js';
import jobRoutes from './modules/jobs/jobs.routes.js';
import schedulingRoutes from './modules/scheduling/scheduling.routes.js';
import scorecardRoutes from './modules/scorecards/scorecards.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import profileRoutes from './modules/profile/profile.routes.js';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Interview Management System API',
  });
});

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/candidates', candidateRoutes);
router.use('/jobs', jobRoutes);
router.use('/scheduling', schedulingRoutes);
router.use('/interviews', schedulingRoutes);
router.use('/scorecards', scorecardRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
