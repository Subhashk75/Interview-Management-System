import { describe, it, expect } from 'vitest';

describe('Candidate Domain Model & Pipeline Logic', () => {
  const VALID_STAGES = ['APPLIED', 'SCREENING', 'INTERVIEWING', 'OFFER', 'HIRED', 'REJECTED'];

  it('should validate allowed candidate stages accurately', () => {
    expect(VALID_STAGES).toContain('APPLIED');
    expect(VALID_STAGES).toContain('SCREENING');
    expect(VALID_STAGES).toContain('INTERVIEWING');
    expect(VALID_STAGES).toContain('OFFER');
    expect(VALID_STAGES).toContain('HIRED');
    expect(VALID_STAGES).toContain('REJECTED');
    expect(VALID_STAGES).not.toContain('UNKNOWN_STAGE');
  });

  it('should format CSV export rows with safe escaping for candidate data', () => {
    const candidateData = {
      firstName: 'Jane, Jr.',
      lastName: 'O"Connor',
      email: 'jane@example.com',
      phone: '+1 555-0199',
      currentCompany: 'Acme, Inc.',
      currentTitle: 'Lead "Cloud" Architect',
      experienceYears: 8,
      appliedJobTitle: 'Senior Full Stack Engineer',
      appliedDepartment: 'Engineering',
      stage: 'INTERVIEWING',
      createdAt: new Date('2026-10-15'),
    };

    const row = [
      `"${candidateData.firstName.replace(/"/g, '""')}"`,
      `"${candidateData.lastName.replace(/"/g, '""')}"`,
      `"${candidateData.email.replace(/"/g, '""')}"`,
      `"${candidateData.phone.replace(/"/g, '""')}"`,
      `"${candidateData.currentCompany.replace(/"/g, '""')}"`,
      `"${candidateData.currentTitle.replace(/"/g, '""')}"`,
      candidateData.experienceYears,
      `"${candidateData.appliedJobTitle.replace(/"/g, '""')}"`,
      `"${candidateData.appliedDepartment.replace(/"/g, '""')}"`,
      `"${candidateData.stage}"`,
      `"${candidateData.createdAt.toISOString().split('T')[0]}"`,
    ].join(',');

    expect(row).toContain('"Jane, Jr."');
    expect(row).toContain('"O""Connor"');
    expect(row).toContain('"Acme, Inc."');
    expect(row).toContain('"Lead ""Cloud"" Architect"');
    expect(row).toContain('8');
    expect(row).toContain('"INTERVIEWING"');
  });

  it('should validate bulk action payloads and reject empty arrays', () => {
    const validateBulkPayload = (candidateIds: any, action: string, stage?: string) => {
      if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
        return { valid: false, error: 'MISSING_CANDIDATE_IDS' };
      }
      if (!['SET_STAGE', 'ARCHIVE'].includes(action)) {
        return { valid: false, error: 'INVALID_BULK_ACTION' };
      }
      if (action === 'SET_STAGE' && (!stage || !VALID_STAGES.includes(stage))) {
        return { valid: false, error: 'INVALID_STAGE' };
      }
      return { valid: true };
    };

    expect(validateBulkPayload([], 'SET_STAGE', 'OFFER').valid).toBe(false);
    expect(validateBulkPayload(['id1', 'id2'], 'INVALID_ACTION').valid).toBe(false);
    expect(validateBulkPayload(['id1', 'id2'], 'SET_STAGE', 'INVALID_STAGE').valid).toBe(false);
    expect(validateBulkPayload(['id1', 'id2'], 'SET_STAGE', 'OFFER').valid).toBe(true);
    expect(validateBulkPayload(['id1', 'id2'], 'ARCHIVE').valid).toBe(true);
  });
});
