import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../../models/User.js';
import { Organization } from '../../models/Organization.js';
import { ENV } from '../../config/env.js';
import { AppError } from '../../utils/appError.js';
import { sendSuccess } from '../../utils/response.js';
import { AuthRequest } from '../../middleware/auth.js';
import { emailService } from '../notifications/email.service.js';

function generateSixDigitOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError('Email and password are required.', 400, 'MISSING_CREDENTIALS');
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +otp +otpExpiresAt');
    if (!user || !user.isActive) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    // Check email verification status
    if (!user.isVerified) {
      // Generate fresh OTP and send verification email
      const newOtp = generateSixDigitOtp();
      user.otp = newOtp;
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      await emailService.sendOtpEmail(user.email, user.firstName, newOtp);

      res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_NOT_VERIFIED',
          message: 'Account not verified. A 6-digit verification code has been dispatched to your email.',
        },
        data: {
          requireOtp: true,
          email: user.email,
        },
      });
      return;
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, organizationId: user.organizationId },
      ENV.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.otp;
    delete userObj.otpExpiresAt;

    sendSuccess(res, { token, user: userObj }, 'Logged in successfully');
  } catch (error) {
    next(error);
  }
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { firstName, lastName, email, password, organizationName, role } = req.body;

    if (!firstName || !lastName || !email || !password) {
      throw new AppError('First name, last name, email, and password are required.', 400, 'MISSING_FIELDS');
    }

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

    const otp = generateSixDigitOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      organizationId: org._id,
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role: role || 'RECRUITER',
      isVerified: false,
      otp,
      otpExpiresAt,
    });

    // Send OTP verification email
    await emailService.sendOtpEmail(user.email, user.firstName, otp);

    sendSuccess(
      res,
      {
        requireOtp: true,
        email: user.email,
        message: 'Registration initiated. Please enter the 6-digit OTP sent to your email to verify your account.',
      },
      'Verification code sent to email',
      201
    );
  } catch (error) {
    next(error);
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      throw new AppError('Email and OTP code are required.', 400, 'MISSING_FIELDS');
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiresAt');
    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    if (!user.otp || !user.otpExpiresAt) {
      throw new AppError('No verification code pending for this account. Please request a new code.', 400, 'NO_OTP_PENDING');
    }

    if (new Date() > user.otpExpiresAt) {
      throw new AppError('Verification code has expired. Please request a new one.', 400, 'OTP_EXPIRED');
    }

    if (user.otp.trim() !== otp.toString().trim()) {
      throw new AppError('Invalid verification code. Please check and try again.', 400, 'INVALID_OTP');
    }

    // Mark user as verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role, organizationId: user.organizationId },
      ENV.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.otp;
    delete userObj.otpExpiresAt;

    sendSuccess(res, { token, user: userObj }, 'Email verified successfully! You are now logged in.');
  } catch (error) {
    next(error);
  }
}

export async function resendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) {
      throw new AppError('Email is required.', 400, 'MISSING_EMAIL');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError('No account found with this email.', 404, 'NOT_FOUND');
    }

    const newOtp = generateSixDigitOtp();
    user.otp = newOtp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await emailService.sendOtpEmail(user.email, user.firstName, newOtp);

    sendSuccess(res, { email: user.email }, 'A fresh 6-digit OTP code has been dispatched to your email.');
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

/* =========================================================================
 * ADMIN ACCESS FOR HR MANAGEMENT
 * ========================================================================= */

export async function adminGetUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await User.find({ organizationId: req.organizationId })
      .select('-password -otp -otpExpiresAt')
      .sort({ createdAt: -1 });

    sendSuccess(res, users, 'List of team members and HR accounts');
  } catch (error) {
    next(error);
  }
}

export async function adminCreateHr(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { firstName, lastName, email, password, role, title, department } = req.body;

    if (!firstName || !lastName || !email || !password) {
      throw new AppError('First name, last name, email, and temporary password are required.', 400, 'MISSING_FIELDS');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('A user with this email already exists.', 409, 'USER_EXISTS');
    }

    const user = await User.create({
      organizationId: req.organizationId,
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role: role || 'RECRUITER',
      title: title || 'Talent Acquisition Partner',
      department: department || 'Human Resources',
      isVerified: true, // Created directly by Admin, auto-verified
      isActive: true,
      avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 50)}?w=150`,
    });

    const userObj = user.toObject();
    delete userObj.password;

    sendSuccess(res, userObj, `HR / Team member ${firstName} ${lastName} created successfully`, 201);
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role } = req.body;
    const { id } = req.params;

    if (!['ADMIN', 'RECRUITER', 'INTERVIEWER', 'CANDIDATE'].includes(role)) {
      throw new AppError('Invalid role specified.', 400, 'INVALID_ROLE');
    }

    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    user.role = role as UserRole;
    await user.save();

    sendSuccess(res, { userId: user._id, role: user.role }, `User role updated to ${role}`);
  } catch (error) {
    next(error);
  }
}

export async function adminToggleStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    user.isActive = !user.isActive;
    await user.save();

    sendSuccess(res, { userId: user._id, isActive: user.isActive }, `User status updated to ${user.isActive ? 'Active' : 'Inactive'}`);
  } catch (error) {
    next(error);
  }
}
