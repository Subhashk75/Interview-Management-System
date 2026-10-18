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

    // Optional user object load
    const user = await User.findById(decoded.userId).select('-password');
    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    next(error);
  }
}

export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      next(new AppError('Forbidden: You do not have permission to perform this action.', 403, 'FORBIDDEN'));
      return;
    }
    next();
  };
}
