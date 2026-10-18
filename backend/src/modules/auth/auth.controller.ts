import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../../models/User.js';
import { Organization } from '../../models/Organization.js';
import { ENV } from '../../config/env.js';
import { AppError } from '../../utils/appError.js';
import { sendSuccess } from '../../utils/response.js';
import { AuthRequest } from '../../middleware/auth.js';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError('Email and password are required.', 400, 'MISSING_CREDENTIALS');
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.isActive) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, organizationId: user.organizationId },
      ENV.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const userObj = user.toObject();
    delete userObj.password;

    sendSuccess(res, { token, user: userObj }, 'Logged in successfully');
  } catch (error) {
    next(error);
  }
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { firstName, lastName, email, password, organizationName, role } = req.body;

    let org = await Organization.findOne();
    if (!org) {
      org = await Organization.create({
        name: organizationName || 'Acme Tech Corp',
        settings: { timezone: 'UTC', scorecardBlindingEnabled: true, defaultBufferMinutes: 15 },
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('User with this email already exists.', 409, 'USER_EXISTS');
    }

    const user = await User.create({
      organizationId: org._id,
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role: role || 'RECRUITER',
    });

    const token = jwt.sign(
      { userId: user._id, role: user.role, organizationId: user.organizationId },
      ENV.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const userObj = user.toObject();
    delete userObj.password;

    sendSuccess(res, { token, user: userObj }, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.userId).populate('organizationId');
    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }
    sendSuccess(res, user, 'Current user profile');
  } catch (error) {
    next(error);
  }
}

export async function getInterviewers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const interviewers = await User.find({
      organizationId: req.organizationId,
      isActive: true,
      role: { $in: ['INTERVIEWER', 'ADMIN', 'RECRUITER'] },
    }).select('-password');
    sendSuccess(res, interviewers, 'List of available interviewers');
  } catch (error) {
    next(error);
  }
}
