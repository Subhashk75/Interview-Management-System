import { User, IUser, UserRole } from '../../models/User.js';
import { Organization } from '../../models/Organization.js';
import { AppError } from '../../utils/appError.js';
import { logger } from '../../utils/logger.js';

export interface ProfileRequirement {
  key: string;
  label: string;
  mandatory: boolean;
  isCompleted: boolean;
}

export interface ProfileCompletionStats {
  percentage: number;
  totalFields: number;
  completedFields: number;
  missingMandatoryFields: string[];
  missingOptionalFields: string[];
  requirements: ProfileRequirement[];
  isFullyComplete: boolean;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  location?: string;
  dateOfBirth?: string;
  gender?: string;
  title?: string;
  department?: string;
  bio?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  skills?: string[];
  experienceYears?: number;
  hiringSpecialization?: string;
  assignedHiringTeams?: string[];
  interviewSpecializations?: string[];
  weeklyCapacityHours?: number;
  dailyInterviewLimit?: number;
  education?: string;
  currentCompany?: string;
  avatarUrl?: string;
}

// Regex helpers
const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;
const URL_REGEX = /^(https?:\/\/)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(:[0-9]+)?(\/.*)?$/;

export class ProfileService {
  /**
   * Defines the field requirements matrix by role.
   */
  getRoleFieldRequirements(role: UserRole): { key: string; label: string; mandatory: boolean }[] {
    switch (role) {
      case 'ADMIN':
        return [
          { key: 'firstName', label: 'First Name', mandatory: true },
          { key: 'lastName', label: 'Last Name', mandatory: true },
          { key: 'email', label: 'Email Address', mandatory: true },
          { key: 'title', label: 'Job Title', mandatory: true },
          { key: 'department', label: 'Department', mandatory: true },
          { key: 'phone', label: 'Contact Phone', mandatory: false },
          { key: 'location', label: 'Location', mandatory: false },
          { key: 'bio', label: 'Professional Bio', mandatory: false },
          { key: 'linkedinUrl', label: 'LinkedIn Profile', mandatory: false },
        ];

      case 'RECRUITER':
        return [
          { key: 'firstName', label: 'First Name', mandatory: true },
          { key: 'lastName', label: 'Last Name', mandatory: true },
          { key: 'email', label: 'Email Address', mandatory: true },
          { key: 'phone', label: 'Contact Phone Number', mandatory: true },
          { key: 'title', label: 'Job Title', mandatory: true },
          { key: 'department', label: 'Department', mandatory: true },
          { key: 'hiringSpecialization', label: 'Hiring Specialization', mandatory: true },
          { key: 'location', label: 'Location', mandatory: false },
          { key: 'assignedHiringTeams', label: 'Assigned Hiring Teams', mandatory: false },
          { key: 'bio', label: 'Professional Bio', mandatory: false },
          { key: 'linkedinUrl', label: 'LinkedIn Profile', mandatory: false },
        ];

      case 'INTERVIEWER':
        return [
          { key: 'firstName', label: 'First Name', mandatory: true },
          { key: 'lastName', label: 'Last Name', mandatory: true },
          { key: 'email', label: 'Email Address', mandatory: true },
          { key: 'title', label: 'Job Title', mandatory: true },
          { key: 'department', label: 'Department', mandatory: true },
          { key: 'skills', label: 'Technical Skills & Competencies', mandatory: true },
          { key: 'experienceYears', label: 'Years of Experience', mandatory: true },
          { key: 'phone', label: 'Phone Number', mandatory: false },
          { key: 'location', label: 'Location', mandatory: false },
          { key: 'interviewSpecializations', label: 'Interview Specializations', mandatory: false },
          { key: 'weeklyCapacityHours', label: 'Weekly Capacity Hours', mandatory: false },
          { key: 'dailyInterviewLimit', label: 'Daily Interview Limit', mandatory: false },
          { key: 'bio', label: 'Professional Bio', mandatory: false },
          { key: 'linkedinUrl', label: 'LinkedIn Profile', mandatory: false },
        ];

      case 'HIRING_MANAGER':
        return [
          { key: 'firstName', label: 'First Name', mandatory: true },
          { key: 'lastName', label: 'Last Name', mandatory: true },
          { key: 'email', label: 'Email Address', mandatory: true },
          { key: 'title', label: 'Job Title / Designation', mandatory: true },
          { key: 'department', label: 'Department / Business Unit', mandatory: true },
          { key: 'phone', label: 'Contact Phone Number', mandatory: false },
          { key: 'location', label: 'Location', mandatory: false },
          { key: 'bio', label: 'Professional Bio', mandatory: false },
          { key: 'linkedinUrl', label: 'LinkedIn Profile', mandatory: false },
        ];

      case 'CANDIDATE':
        return [
          { key: 'firstName', label: 'First Name', mandatory: true },
          { key: 'lastName', label: 'Last Name', mandatory: true },
          { key: 'email', label: 'Email Address', mandatory: true },
          { key: 'phone', label: 'Contact Phone Number', mandatory: true },
          { key: 'skills', label: 'Key Skills', mandatory: true },
          { key: 'currentTitle', label: 'Current Role/Title', mandatory: false },
          { key: 'currentCompany', label: 'Current Company', mandatory: false },
          { key: 'experienceYears', label: 'Years of Experience', mandatory: false },
          { key: 'education', label: 'Education / Degree', mandatory: false },
          { key: 'resumeUrl', label: 'Resume Document URL', mandatory: false },
          { key: 'linkedinUrl', label: 'LinkedIn Profile', mandatory: false },
          { key: 'portfolioUrl', label: 'Portfolio URL', mandatory: false },
          { key: 'bio', label: 'Professional Summary', mandatory: false },
          { key: 'location', label: 'Location', mandatory: false },
        ];

      default:
        return [
          { key: 'firstName', label: 'First Name', mandatory: true },
          { key: 'lastName', label: 'Last Name', mandatory: true },
          { key: 'email', label: 'Email Address', mandatory: true },
        ];
    }
  }

  /**
   * Calculates dynamic profile completeness based on the user's role and data.
   */
  calculateProfileCompletion(user: IUser): ProfileCompletionStats {
    const requirements = this.getRoleFieldRequirements(user.role);
    const userObj = user.toObject ? user.toObject() : user;

    const evaluatedReqs: ProfileRequirement[] = [];
    const missingMandatoryFields: string[] = [];
    const missingOptionalFields: string[] = [];

    let mandatoryTotal = 0;
    let mandatoryCompleted = 0;
    let optionalTotal = 0;
    let optionalCompleted = 0;

    for (const req of requirements) {
      const val = (userObj as any)[req.key];
      let isCompleted = false;

      if (Array.isArray(val)) {
        isCompleted = val.length > 0;
      } else if (typeof val === 'number') {
        isCompleted = !isNaN(val) && val >= 0;
      } else if (typeof val === 'string') {
        isCompleted = val.trim().length > 0;
      } else if (val !== undefined && val !== null) {
        isCompleted = true;
      }

      evaluatedReqs.push({
        key: req.key,
        label: req.label,
        mandatory: req.mandatory,
        isCompleted,
      });

      if (req.mandatory) {
        mandatoryTotal++;
        if (isCompleted) {
          mandatoryCompleted++;
        } else {
          missingMandatoryFields.push(req.label);
        }
      } else {
        optionalTotal++;
        if (isCompleted) {
          optionalCompleted++;
        } else {
          missingOptionalFields.push(req.label);
        }
      }
    }

    // Weighted completion formula:
    // Mandatory fields constitute 70% of the total score.
    // Optional fields constitute the remaining 30%.
    const mandatoryScore = mandatoryTotal > 0 ? (mandatoryCompleted / mandatoryTotal) * 70 : 70;
    const optionalScore = optionalTotal > 0 ? (optionalCompleted / optionalTotal) * 30 : 30;

    let percentage = Math.round(mandatoryScore + optionalScore);

    // Rule: Do not allow users to reach 100% (or above 75%) if ANY mandatory field is missing
    if (missingMandatoryFields.length > 0) {
      percentage = Math.min(percentage, 75);
    }

    // If all fields are completed, explicitly snap to 100%
    if (missingMandatoryFields.length === 0 && missingOptionalFields.length === 0) {
      percentage = 100;
    }

    return {
      percentage,
      totalFields: requirements.length,
      completedFields: mandatoryCompleted + optionalCompleted,
      missingMandatoryFields,
      missingOptionalFields,
      requirements: evaluatedReqs,
      isFullyComplete: missingMandatoryFields.length === 0 && percentage === 100,
    };
  }

  /**
   * Retrieves profile details and calculated completion statistics for the user.
   */
  async getProfile(userId: string) {
    const user = await User.findById(userId).populate('organizationId', 'name domain settings');
    if (!user) {
      throw new AppError('User profile not found.', 404, 'NOT_FOUND');
    }

    const stats = this.calculateProfileCompletion(user);

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.otp;
    delete userObj.otpExpiresAt;

    return {
      user: userObj,
      stats,
    };
  }

  /**
   * Updates permitted profile information with role-specific validation and sanitization.
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User profile not found.', 404, 'NOT_FOUND');
    }

    const role = user.role;
    const errors: { [key: string]: string } = {};

    // 1. Basic Personal Information Validation
    if (dto.firstName !== undefined) {
      const trimmed = dto.firstName.trim();
      if (!trimmed) {
        errors.firstName = 'First name cannot be empty.';
      } else if (trimmed.length > 50) {
        errors.firstName = 'First name cannot exceed 50 characters.';
      } else {
        user.firstName = trimmed;
      }
    }

    if (dto.lastName !== undefined) {
      const trimmed = dto.lastName.trim();
      if (!trimmed) {
        errors.lastName = 'Last name cannot be empty.';
      } else if (trimmed.length > 50) {
        errors.lastName = 'Last name cannot exceed 50 characters.';
      } else {
        user.lastName = trimmed;
      }
    }

    // Phone validation
    if (dto.phone !== undefined) {
      const trimmedPhone = dto.phone.trim();
      if (trimmedPhone) {
        if (!PHONE_REGEX.test(trimmedPhone)) {
          errors.phone = 'Please provide a valid phone number (e.g. +1 555-0192 or 10-15 digits).';
        } else {
          user.phone = trimmedPhone;
        }
      } else {
        user.phone = undefined;
      }
    }

    // Location
    if (dto.location !== undefined) {
      user.location = dto.location.trim() || undefined;
    }

    // Date of Birth & Gender
    if (dto.dateOfBirth !== undefined) {
      user.dateOfBirth = dto.dateOfBirth.trim() || undefined;
    }
    if (dto.gender !== undefined) {
      user.gender = dto.gender.trim() || undefined;
    }

    // Professional Bio
    if (dto.bio !== undefined) {
      const trimmedBio = dto.bio.trim();
      if (trimmedBio.length > 1000) {
        errors.bio = 'Bio cannot exceed 1000 characters.';
      } else {
        user.bio = trimmedBio || undefined;
      }
    }

    // URLs validation
    if (dto.linkedinUrl !== undefined) {
      const trimmed = dto.linkedinUrl.trim();
      if (trimmed) {
        if (!URL_REGEX.test(trimmed) || !trimmed.toLowerCase().includes('linkedin.com/')) {
          errors.linkedinUrl = 'LinkedIn URL must be a valid link (e.g. https://linkedin.com/in/username).';
        } else {
          user.linkedinUrl = trimmed;
        }
      } else {
        user.linkedinUrl = undefined;
      }
    }

    if (dto.portfolioUrl !== undefined) {
      const trimmed = dto.portfolioUrl.trim();
      if (trimmed) {
        if (!URL_REGEX.test(trimmed)) {
          errors.portfolioUrl = 'Portfolio URL must be a valid web link.';
        } else {
          user.portfolioUrl = trimmed;
        }
      } else {
        user.portfolioUrl = undefined;
      }
    }

    if (dto.resumeUrl !== undefined) {
      const trimmed = dto.resumeUrl.trim();
      if (trimmed) {
        if (!URL_REGEX.test(trimmed)) {
          errors.resumeUrl = 'Resume URL must be a valid document link.';
        } else {
          user.resumeUrl = trimmed;
        }
      } else {
        user.resumeUrl = undefined;
      }
    }

    if (dto.avatarUrl !== undefined) {
      const trimmed = dto.avatarUrl.trim();
      if (trimmed) {
        if (!URL_REGEX.test(trimmed) && !trimmed.startsWith('data:image/')) {
          errors.avatarUrl = 'Avatar must be a valid image URL or data format.';
        } else {
          user.avatarUrl = trimmed;
        }
      } else {
        user.avatarUrl = undefined;
      }
    }

    // 2. Role-Specific Professional Information Validation
    if (['ADMIN', 'RECRUITER', 'INTERVIEWER', 'HIRING_MANAGER'].includes(role)) {
      if (dto.title !== undefined) {
        const trimmed = dto.title.trim();
        if (!trimmed) {
          errors.title = 'Job title is mandatory.';
        } else {
          user.title = trimmed;
        }
      }

      if (dto.department !== undefined) {
        const trimmed = dto.department.trim();
        if (!trimmed) {
          errors.department = 'Department is mandatory.';
        } else {
          user.department = trimmed;
        }
      }
    }

    // Role = RECRUITER
    if (role === 'RECRUITER') {
      if (dto.hiringSpecialization !== undefined) {
        const trimmed = dto.hiringSpecialization.trim();
        if (!trimmed) {
          errors.hiringSpecialization = 'Hiring specialization is required for Recruiters.';
        } else {
          user.hiringSpecialization = trimmed;
        }
      }

      if (dto.assignedHiringTeams !== undefined) {
        user.assignedHiringTeams = Array.isArray(dto.assignedHiringTeams)
          ? dto.assignedHiringTeams.map((t) => t.trim()).filter(Boolean)
          : [];
      }
    }

    // Role = INTERVIEWER
    if (role === 'INTERVIEWER') {
      if (dto.skills !== undefined) {
        const filtered = Array.isArray(dto.skills)
          ? dto.skills.map((s) => s.trim()).filter(Boolean)
          : [];
        if (filtered.length === 0) {
          errors.skills = 'At least one technical competency or skill is required for Interviewers.';
        } else {
          user.skills = filtered;
        }
      }

      if (dto.experienceYears !== undefined) {
        const exp = Number(dto.experienceYears);
        if (isNaN(exp) || exp < 0 || exp > 60) {
          errors.experienceYears = 'Years of experience must be a valid number between 0 and 60.';
        } else {
          user.experienceYears = exp;
        }
      }

      if (dto.weeklyCapacityHours !== undefined) {
        const cap = Number(dto.weeklyCapacityHours);
        if (isNaN(cap) || cap < 1 || cap > 40) {
          errors.weeklyCapacityHours = 'Weekly capacity must be between 1 and 40 hours.';
        } else {
          user.weeklyCapacityHours = cap;
        }
      }

      if (dto.dailyInterviewLimit !== undefined) {
        const limit = Number(dto.dailyInterviewLimit);
        if (isNaN(limit) || limit < 1 || limit > 10) {
          errors.dailyInterviewLimit = 'Daily interview limit must be between 1 and 10.';
        } else {
          user.dailyInterviewLimit = limit;
        }
      }

      if (dto.interviewSpecializations !== undefined) {
        user.interviewSpecializations = Array.isArray(dto.interviewSpecializations)
          ? dto.interviewSpecializations.map((s) => s.trim()).filter(Boolean)
          : [];
      }
    }

    // Role = CANDIDATE
    if (role === 'CANDIDATE') {
      if (dto.skills !== undefined) {
        const filtered = Array.isArray(dto.skills)
          ? dto.skills.map((s) => s.trim()).filter(Boolean)
          : [];
        if (filtered.length === 0) {
          errors.skills = 'At least one key skill is required.';
        } else {
          user.skills = filtered;
        }
      }

      if (dto.currentCompany !== undefined) {
        user.currentCompany = dto.currentCompany.trim() || undefined;
      }
      if (dto.education !== undefined) {
        user.education = dto.education.trim() || undefined;
      }
      if (dto.title !== undefined) {
        user.title = dto.title.trim() || undefined;
      }
      if (dto.experienceYears !== undefined) {
        const exp = Number(dto.experienceYears);
        if (isNaN(exp) || exp < 0) {
          errors.experienceYears = 'Experience years must be 0 or higher.';
        } else {
          user.experienceYears = exp;
        }
      }
    }

    // Check mandatory fields completeness based on updated user state
    const requirements = this.getRoleFieldRequirements(user.role);
    for (const req of requirements) {
      if (req.mandatory) {
        const val = (user as any)[req.key];
        let hasValue = false;
        if (Array.isArray(val)) {
          hasValue = val.length > 0;
        } else if (typeof val === 'number') {
          hasValue = !isNaN(val) && val >= 0;
        } else if (typeof val === 'string') {
          hasValue = val.trim().length > 0;
        }

        if (!hasValue && !errors[req.key]) {
          errors[req.key] = `${req.label} is required for ${user.role} role.`;
        }
      }
    }

    // If validation errors exist, throw 400 Bad Request
    if (Object.keys(errors).length > 0) {
      throw new AppError('Validation failed on one or more profile fields.', 400, 'VALIDATION_ERROR', errors);
    }

    await user.save();
    logger.info(`Profile updated successfully for user ${userId} (${user.email}, Role: ${user.role})`);

    const stats = this.calculateProfileCompletion(user);
    const updatedUserObj = user.toObject();
    delete updatedUserObj.password;
    delete updatedUserObj.otp;
    delete updatedUserObj.otpExpiresAt;

    return {
      user: updatedUserObj,
      stats,
    };
  }

  /**
   * Updates only avatar image URL.
   */
  async updateAvatar(userId: string, avatarUrl: string) {
    if (!avatarUrl || !avatarUrl.trim()) {
      throw new AppError('Avatar URL cannot be empty.', 400, 'INVALID_AVATAR');
    }

    const trimmed = avatarUrl.trim();
    if (!URL_REGEX.test(trimmed) && !trimmed.startsWith('data:image/')) {
      throw new AppError('Avatar must be a valid URL or image format.', 400, 'INVALID_AVATAR');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    user.avatarUrl = trimmed;
    await user.save();

    return { avatarUrl: user.avatarUrl };
  }
}

export const profileService = new ProfileService();
