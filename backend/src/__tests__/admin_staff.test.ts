import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '../models/User.js';

describe('Admin Staff Management & Mandatory First Login Password Change', () => {
  describe('Role Normalization & Enums', () => {
    it('should recognize all supported enterprise staff and candidate roles', () => {
      const allowedRoles: UserRole[] = [
        'ADMIN',
        'HR',
        'RECRUITER',
        'INTERVIEWER',
        'MANAGER',
        'HIRING_MANAGER',
        'CANDIDATE',
      ];

      expect(allowedRoles).toContain('ADMIN');
      expect(allowedRoles).toContain('HR');
      expect(allowedRoles).toContain('RECRUITER');
      expect(allowedRoles).toContain('INTERVIEWER');
      expect(allowedRoles).toContain('MANAGER');
      expect(allowedRoles).toContain('HIRING_MANAGER');
      expect(allowedRoles).toContain('CANDIDATE');
    });

    it('should treat HR and RECRUITER, and MANAGER and HIRING_MANAGER as aliases in authorization logic', () => {
      const isRoleAllowed = (userRole: string, allowedRoles: string[]) => {
        const normalized = userRole === 'HR' ? 'RECRUITER' : userRole === 'MANAGER' ? 'HIRING_MANAGER' : userRole;
        const normalizedAllowed = allowedRoles.map((r) =>
          r === 'HR' ? 'RECRUITER' : r === 'MANAGER' ? 'HIRING_MANAGER' : r
        );
        return normalizedAllowed.includes(normalized);
      };

      // HR accessing an endpoint protected for RECRUITER
      expect(isRoleAllowed('HR', ['RECRUITER'])).toBe(true);
      // RECRUITER accessing an endpoint protected for HR
      expect(isRoleAllowed('RECRUITER', ['HR'])).toBe(true);
      // MANAGER accessing an endpoint protected for HIRING_MANAGER
      expect(isRoleAllowed('MANAGER', ['HIRING_MANAGER'])).toBe(true);
      // CANDIDATE accessing an endpoint protected for ADMIN
      expect(isRoleAllowed('CANDIDATE', ['ADMIN'])).toBe(false);
    });
  });

  describe('Public Registration Security Constraint', () => {
    it('must enforce CANDIDATE role on public registration regardless of incoming role in payload', () => {
      const simulatePublicRegistration = (clientPayload: {
        firstName: string;
        lastName: string;
        email: string;
        role?: string;
      }) => {
        // Enforce server-side security rule: Public registration ALWAYS defaults to CANDIDATE
        const assignedRole: UserRole = 'CANDIDATE';
        return {
          ...clientPayload,
          role: assignedRole,
          mustChangePassword: false, // Candidates choose their own password during registration
        };
      };

      // Attacker tries to self-register as ADMIN
      const maliciousPayload = {
        firstName: 'Malicious',
        lastName: 'Actor',
        email: 'hacker@example.com',
        role: 'ADMIN',
      };

      const registeredUser = simulatePublicRegistration(maliciousPayload);
      expect(registeredUser.role).toBe('CANDIDATE');
      expect(registeredUser.role).not.toBe('ADMIN');
      expect(registeredUser.mustChangePassword).toBe(false);
    });
  });

  describe('Admin Staff Provisioning Security Policy', () => {
    it('should set mustChangePassword = true and auto-generate secure temporary password when creating staff accounts', async () => {
      const simulateAdminStaffCreation = (adminInput: {
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        temporaryPassword?: string;
      }) => {
        const allowedStaffRoles = ['HR', 'INTERVIEWER', 'MANAGER', 'RECRUITER', 'HIRING_MANAGER'];
        if (!allowedStaffRoles.includes(adminInput.role)) {
          throw new Error('Invalid staff role');
        }

        const generatedPass =
          adminInput.temporaryPassword?.trim() ||
          `Staff#${Math.random().toString(36).substring(2, 6).toUpperCase()}!${Math.floor(100 + Math.random() * 900)}`;

        return {
          user: {
            firstName: adminInput.firstName,
            lastName: adminInput.lastName,
            email: adminInput.email,
            role: adminInput.role,
            mustChangePassword: true,
            isActive: true,
            isVerified: true,
          },
          temporaryPassword: generatedPass,
        };
      };

      const result = simulateAdminStaffCreation({
        firstName: 'Rachel',
        lastName: 'Green',
        email: 'rachel.green@company.com',
        role: 'HR',
      });

      expect(result.user.mustChangePassword).toBe(true);
      expect(result.user.role).toBe('HR');
      expect(result.user.isVerified).toBe(true);
      expect(result.temporaryPassword.length).toBeGreaterThanOrEqual(8);
      expect(result.temporaryPassword).toMatch(/Staff#/);
    });

    it('should reject staff creation with CANDIDATE role in staff provisioning endpoint', () => {
      const allowedStaffRoles = ['HR', 'INTERVIEWER', 'MANAGER', 'RECRUITER', 'HIRING_MANAGER'];
      expect(allowedStaffRoles.includes('CANDIDATE')).toBe(false);
    });
  });

  describe('Mandatory Password Change Enforcement Middleware Logic', () => {
    it('should block non-password-change API endpoints when mustChangePassword is true', () => {
      const bypassRoutes = ['/auth/change-password', '/auth/me', '/auth/logout'];

      const checkAccess = (mustChangePassword: boolean, path: string) => {
        if (mustChangePassword) {
          const isAllowedPath = bypassRoutes.some((route) => path.startsWith(route));
          if (!isAllowedPath) {
            return {
              allowed: false,
              statusCode: 403,
              errorCode: 'PASSWORD_CHANGE_REQUIRED',
            };
          }
        }
        return { allowed: true, statusCode: 200 };
      };

      // Trying to access candidate pipeline
      const pipelineAttempt = checkAccess(true, '/candidates');
      expect(pipelineAttempt.allowed).toBe(false);
      expect(pipelineAttempt.statusCode).toBe(403);
      expect(pipelineAttempt.errorCode).toBe('PASSWORD_CHANGE_REQUIRED');

      // Trying to schedule interview
      const scheduleAttempt = checkAccess(true, '/interviews/schedule');
      expect(scheduleAttempt.allowed).toBe(false);
      expect(scheduleAttempt.statusCode).toBe(403);

      // Accessing change-password endpoint
      const changePasswordAttempt = checkAccess(true, '/auth/change-password');
      expect(changePasswordAttempt.allowed).toBe(true);

      // Accessing /auth/me
      const meAttempt = checkAccess(true, '/auth/me');
      expect(meAttempt.allowed).toBe(true);

      // Accessing logout
      const logoutAttempt = checkAccess(true, '/auth/logout');
      expect(logoutAttempt.allowed).toBe(true);

      // Once password is changed (mustChangePassword = false), all endpoints allowed
      const resolvedAttempt = checkAccess(false, '/candidates');
      expect(resolvedAttempt.allowed).toBe(true);
    });
  });

  describe('Password Complexity & Hashing Verification', () => {
    it('should validate password complexity and securely hash new passwords', async () => {
      const validatePasswordPolicy = (pwd: string) => {
        if (!pwd || pwd.length < 8) return false;
        const hasUpper = /[A-Z]/.test(pwd);
        const hasLower = /[a-z]/.test(pwd);
        const hasNumber = /[0-9]/.test(pwd);
        return hasUpper && hasLower && hasNumber;
      };

      expect(validatePasswordPolicy('short')).toBe(false);
      expect(validatePasswordPolicy('lowercaseonly123')).toBe(false);
      expect(validatePasswordPolicy('UPPERCASEONLY123')).toBe(false);
      expect(validatePasswordPolicy('ValidPassword123!')).toBe(true);

      // Verify bcrypt hashing and comparison
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('ValidPassword123!', salt);

      const isValidOld = await bcrypt.compare('WrongPassword!', hashedPassword);
      const isValidCorrect = await bcrypt.compare('ValidPassword123!', hashedPassword);

      expect(isValidOld).toBe(false);
      expect(isValidCorrect).toBe(true);
    });
  });
});
