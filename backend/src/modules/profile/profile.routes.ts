import { Router } from 'express';
import { getProfile, updateProfile, updateAvatar } from './profile.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Profile endpoints
router.get('/me', getProfile);
router.put('/me', updateProfile);
router.post('/me/avatar', updateAvatar);

export default router;
