import { describe, it, expect } from 'vitest';
import { profileService } from '../modules/profile/profile.service.js';

describe('Role-Based Profile Management Module', () => {
  describe('Role Field Requirements Matrix', () => {
    it('should return required fields for RECRUITER including hiringSpecialization and phone', () => {
      const reqs = profileService.getRoleFieldRequirements('RECRUITER');
      const mandatoryKeys = reqs.filter((r) => r.mandatory).map((r) => r.key);

      expect(mandatoryKeys).toContain('firstName');
      expect(mandatoryKeys).toContain('lastName');
      expect(mandatoryKeys).toContain('email');
      expect(mandatoryKeys).toContain('phone');
      expect(mandatoryKeys).toContain('title');
      expect(mandatoryKeys).toContain('department');
      expect(mandatoryKeys).toContain('hiringSpecialization');
    });

    it('should return required fields for INTERVIEWER including skills and experienceYears', () => {
      const reqs = profileService.getRoleFieldRequirements('INTERVIEWER');
      const mandatoryKeys = reqs.filter((r) => r.mandatory).map((r) => r.key);

      expect(mandatoryKeys).toContain('skills');
      expect(mandatoryKeys).toContain('experienceYears');
      expect(mandatoryKeys).toContain('title');
      expect(mandatoryKeys).toContain('department');
    });

    it('should return required fields for ADMIN', () => {
      const reqs = profileService.getRoleFieldRequirements('ADMIN');
      const mandatoryKeys = reqs.filter((r) => r.mandatory).map((r) => r.key);

      expect(mandatoryKeys).toContain('firstName');
      expect(mandatoryKeys).toContain('lastName');
      expect(mandatoryKeys).toContain('title');
      expect(mandatoryKeys).toContain('department');
    });
  });

  describe('Profile Completion Calculation Engine', () => {
    it('should cap completion percentage at 75% max when ANY mandatory field is missing', () => {
      // Recruiter missing mandatory phone and hiringSpecialization
      const mockRecruiter: any = {
        role: 'RECRUITER',
        firstName: 'Alex',
        lastName: 'Rivera',
        email: 'recruiter@acme.com',
        title: 'Senior Technical Recruiter',
        department: 'Talent Acquisition',
        location: 'San Francisco, CA',
        bio: 'Tech sourcing specialist.',
        linkedinUrl: 'https://linkedin.com/in/alexrivera',
        // phone and hiringSpecialization omitted!
      };

      const stats = profileService.calculateProfileCompletion(mockRecruiter);
      expect(stats.percentage).toBeLessThanOrEqual(75);
      expect(stats.isFullyComplete).toBe(false);
      expect(stats.missingMandatoryFields).toContain('Contact Phone Number');
      expect(stats.missingMandatoryFields).toContain('Hiring Specialization');
    });

    it('should achieve 100% completion when all mandatory and optional fields are provided', () => {
      const mockInterviewer: any = {
        role: 'INTERVIEWER',
        firstName: 'David',
        lastName: 'Kim',
        email: 'david.kim@acme.com',
        title: 'Staff Distributed Systems Engineer',
        department: 'Platform Engineering',
        skills: ['System Design', 'Go', 'Distributed Systems'],
        experienceYears: 10,
        phone: '+1 555-0199',
        location: 'New York, NY',
        interviewSpecializations: ['System Architecture', 'Coding'],
        weeklyCapacityHours: 4,
        dailyInterviewLimit: 2,
        bio: 'Specialist in high-throughput architectures.',
        linkedinUrl: 'https://linkedin.com/in/davidkim',
      };

      const stats = profileService.calculateProfileCompletion(mockInterviewer);
      expect(stats.percentage).toBe(100);
      expect(stats.isFullyComplete).toBe(true);
      expect(stats.missingMandatoryFields.length).toBe(0);
      expect(stats.missingOptionalFields.length).toBe(0);
    });
  });
});
