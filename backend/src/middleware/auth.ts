import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { AppError } from '../utils/appError.js';
import { User, IUser } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
  userRole?: string;
  organizationId?: string;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Missing Bearer token.', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as {
      userId: string;
      role: string;
      organizationId: string;
    };

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.organizationId = decoded.organizationId;

    // Load user object from DB
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      throw new AppError('User not found or session invalid.', 401, 'USER_NOT_FOUND');
    }
    if (!user.isActive) {
      throw new AppError('Account is deactivated. Please contact your administrator.', 403, 'ACCOUNT_DEACTIVATED');
    }

    req.user = user;
    req.userRole = user.role;

    // Mandatory first login password change enforcement
    if (user.mustChangePassword) {
      const isAllowedEndpoint =
        req.originalUrl.includes('/auth/change-password') ||
        req.originalUrl.includes('/auth/me') ||
        req.originalUrl.includes('/auth/logout');

      if (!isAllowedEndpoint) {
        throw new AppError(
          'Password change required. You must change your temporary password before accessing platform features.',
          403,
          'PASSWORD_CHANGE_REQUIRED'
        );
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

export function authorize(...allowedRoles: string[]) {
  const expandedRoles = new Set(allowedRoles);
  if (allowedRoles.includes('HR')) expandedRoles.add('RECRUITER');
  if (allowedRoles.includes('RECRUITER')) expandedRoles.add('HR');
  if (allowedRoles.includes('MANAGER')) expandedRoles.add('HIRING_MANAGER');
  if (allowedRoles.includes('HIRING_MANAGER')) expandedRoles.add('MANAGER');

  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole || !expandedRoles.has(req.userRole)) {
      next(new AppError('Forbidden: You do not have permission to perform this action.', 403, 'FORBIDDEN'));
      return;
    }
    next();
  };
}
