import { Response, NextFunction } from 'express';
import { profileService } from './profile.service.js';
import { AuthRequest } from '../../middleware/auth.js';
import { sendSuccess } from '../../utils/response.js';

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await profileService.getProfile(req.userId!);
    sendSuccess(res, result, 'User profile retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await profileService.updateProfile(req.userId!, req.body);
    sendSuccess(res, result, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function updateAvatar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { avatarUrl } = req.body;
    const result = await profileService.updateAvatar(req.userId!, avatarUrl);
    sendSuccess(res, result, 'Avatar updated successfully');
  } catch (error) {
    next(error);
  }
}
