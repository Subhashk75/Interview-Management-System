import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../../models/User.js';
import { Organization } from '../../models/Organization.js';
import { Candidate } from '../../models/Candidate.js';
import { AuditLog } from '../../models/AuditLog.js';
import { ENV } from '../../config/env.js';
import { AppError } from '../../utils/appError.js';
import { sendSuccess } from '../../utils/response.js';
import { AuthRequest } from '../../middleware/auth.js';
import { emailService } from '../notifications/email.service.js';

function generateSixDigitOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateSecureTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let pass = 'Temp!';
  for (let i = 0; i < 6; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError('Email and password are required.', 400, 'MISSING_CREDENTIALS');
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +otp +otpExpiresAt');
    if (!user) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    // Deactivation check
    if (!user.isActive) {
      throw new AppError('Account is deactivated. Please contact your system administrator.', 403, 'ACCOUNT_DEACTIVATED');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    // Check email verification status
    if (!user.isVerified) {
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

    sendSuccess(
      res,
      {
        token,
        requirePasswordChange: !!user.mustChangePassword,
        user: userObj,
      },
      user.mustChangePassword
        ? 'Login successful. Temporary password change required.'
        : 'Logged in successfully'
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Public Registration
 * ALWAYS forces role to 'CANDIDATE'. Rejects or ignores any attempt to register privileged roles.
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { firstName, lastName, email, password, organizationName } = req.body;

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
      if (!existingUser.isVerified) {
        // User already started registration but hasn't completed OTP verification.
        // Update password if new one provided and dispatch fresh OTP!
        const newOtp = generateSixDigitOtp();
        existingUser.otp = newOtp;
        existingUser.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        if (password) {
          existingUser.password = password;
        }
        await existingUser.save();
        await emailService.sendOtpEmail(existingUser.email, existingUser.firstName, newOtp);

        sendSuccess(
          res,
          {
            requireOtp: true,
            email: existingUser.email,
            message: 'A fresh 6-digit verification code has been dispatched to your email.',
          },
          'Registration resumed. Please enter the verification code sent to your email.',
          200
        );
        return;
      }
      throw new AppError('User with this email already exists. Please sign in.', 409, 'USER_EXISTS');
    }

    const otp = generateSixDigitOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Rule: Public registration is strictly for Candidates!
    const user = await User.create({
      organizationId: org._id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'CANDIDATE',
      isVerified: false,
      mustChangePassword: false,
      otp,
      otpExpiresAt,
    });

    // Create corresponding Candidate document in pipeline if not already present
    const existingCandidate = await Candidate.findOne({ email: email.toLowerCase().trim() });
    if (!existingCandidate) {
      await Candidate.create({
        organizationId: org._id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        stage: 'APPLIED',
        skills: [],
        timezone: 'UTC',
        isArchived: false,
      });
    }

    // Send OTP verification email
    await emailService.sendOtpEmail(user.email, user.firstName, otp);

    sendSuccess(
      res,
      {
        requireOtp: true,
        email: user.email,
        message: 'Registration initiated. Please enter the 6-digit OTP sent to your email to verify your candidate account.',
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

/**
 * Mandatory Password Change
 * Replaces temporary password with user-chosen permanent password.
 * Resets mustChangePassword flag to false.
 */
export async function changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current temporary password and new password are required.', 400, 'MISSING_FIELDS');
    }

    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters long.', 400, 'WEAK_PASSWORD');
    }

    if (currentPassword === newPassword) {
      throw new AppError('New password must be different from your current temporary password.', 400, 'SAME_PASSWORD');
    }

    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError('Current temporary password is incorrect.', 401, 'INVALID_CURRENT_PASSWORD');
    }

    // Update password and clear mustChangePassword flag
    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    // Invalidate old token and issue fresh token
    const token = jwt.sign(
      { userId: user._id, role: user.role, organizationId: user.organizationId },
      ENV.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const userObj = user.toObject();
    delete userObj.password;

    sendSuccess(
      res,
      {
        token,
        user: userObj,
        requirePasswordChange: false,
      },
      'Password updated successfully! Welcome to your dashboard.'
    );
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
      role: { $in: ['INTERVIEWER', 'ADMIN', 'HR', 'RECRUITER', 'MANAGER', 'HIRING_MANAGER'] },
    }).select('-password');
    sendSuccess(res, interviewers, 'List of available interviewers');
  } catch (error) {
    next(error);
  }
}

/* =========================================================================
 * ADMIN ACCESS FOR STAFF & ACCOUNT MANAGEMENT
 * ========================================================================= */

export async function adminGetUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role, status, search } = req.query;

    const filter: any = { organizationId: req.organizationId };

    if (role && role !== 'ALL') {
      if (role === 'HR') {
        filter.role = { $in: ['HR', 'RECRUITER'] };
      } else if (role === 'MANAGER') {
        filter.role = { $in: ['MANAGER', 'HIRING_MANAGER'] };
      } else {
        filter.role = role;
      }
    }

    if (status === 'ACTIVE') filter.isActive = true;
    if (status === 'INACTIVE') filter.isActive = false;

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { title: { $regex: q, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-password -otp -otpExpiresAt')
      .sort({ createdAt: -1 });

    sendSuccess(res, users, 'List of team members and staff accounts');
  } catch (error) {
    next(error);
  }
}

/**
 * Admin Creates Staff Account:
 * HR, Interviewer, or Manager.
 * Automatically enforces mustChangePassword = true.
 */
export async function adminCreateStaff(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { firstName, lastName, email, phone, role, title, department, temporaryPassword } = req.body;

    if (!firstName || !lastName || !email) {
      throw new AppError('First name, last name, and email are required.', 400, 'MISSING_FIELDS');
    }

    // Validate permitted staff roles
    const validStaffRoles = ['HR', 'INTERVIEWER', 'MANAGER', 'RECRUITER', 'HIRING_MANAGER'];
    const assignedRole = role || 'HR';
    if (!validStaffRoles.includes(assignedRole)) {
      throw new AppError(
        'Invalid staff role. Admin can only create HR, Interviewer, or Manager accounts.',
        400,
        'INVALID_ROLE'
      );
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('A user with this email already exists.', 409, 'USER_EXISTS');
    }

    const tempPass = temporaryPassword || generateSecureTemporaryPassword();

    const user = await User.create({
      organizationId: req.organizationId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : undefined,
      password: tempPass,
      role: assignedRole,
      title: title || (assignedRole === 'HR' ? 'Talent Acquisition Partner' : assignedRole === 'MANAGER' ? 'Engineering Manager' : 'Technical Interviewer'),
      department: department || (assignedRole === 'HR' ? 'Human Resources' : 'Engineering'),
      isVerified: true,
      isActive: true,
      mustChangePassword: true, // MANDATORY FIRST LOGIN ENFORCEMENT
      createdBy: req.userId,
      avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 50)}?w=150`,
    });

    await AuditLog.create({
      organizationId: req.organizationId,
      userId: req.userId,
      action: 'STAFF_ACCOUNT_CREATED',
      entityType: 'User',
      entityId: user._id.toString(),
      details: {
        email: user.email,
        role: user.role,
        mustChangePassword: true,
      },
    });

    const userObj = user.toObject();
    delete userObj.password;

    sendSuccess(
      res,
      {
        user: userObj,
        temporaryPassword: tempPass,
        mustChangePassword: true,
      },
      `Staff account (${assignedRole}) created for ${firstName} ${lastName}. Temporary password issued.`,
      201
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Admin Resets Staff Password:
 * Sets new temporary password and marks mustChangePassword = true.
 */
export async function adminResetPassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { temporaryPassword } = req.body;

    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    const tempPass = temporaryPassword || generateSecureTemporaryPassword();
    user.password = tempPass;
    user.mustChangePassword = true;
    await user.save();

    await AuditLog.create({
      organizationId: req.organizationId,
      userId: req.userId,
      action: 'PASSWORD_RESET_BY_ADMIN',
      entityType: 'User',
      entityId: user._id.toString(),
      details: { email: user.email, resetBy: req.userId },
    });

    sendSuccess(
      res,
      {
        userId: user._id,
        email: user.email,
        temporaryPassword: tempPass,
        mustChangePassword: true,
      },
      `Password reset initiated for ${user.firstName} ${user.lastName}. Temporary credentials generated.`
    );
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role } = req.body;
    const { id } = req.params;

    const allowedRoles = ['ADMIN', 'HR', 'RECRUITER', 'INTERVIEWER', 'MANAGER', 'HIRING_MANAGER', 'CANDIDATE'];
    if (!allowedRoles.includes(role)) {
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

    sendSuccess(
      res,
      { userId: user._id, isActive: user.isActive },
      `User status updated to ${user.isActive ? 'Active' : 'Inactive'}`
    );
  } catch (error) {
    next(error);
  }
}
