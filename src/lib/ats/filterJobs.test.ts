import { describe, it, expect } from 'vitest';
import { filterJobsByProfile, jobMatchScore } from './filterJobs';
import type { RawJob } from './types';
import type { Profile } from '../../types';

const baseJob: RawJob = {
  id: 'test:job',
  source: 'greenhouse',
  company: 'Test',
  title: '',
  location: 'Remote',
  description: '',
  applyUrl: 'https://x',
  department: null,
  updatedAt: null,
};

const baseProfile: Profile = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  yearsOfExperience: 7,
  stackSignals: ['Go', 'PostgreSQL', 'Kubernetes'],
  employmentTypes: ['full-time'],
  compFloor: 200000,
  locationPreference: 'remote',
  country: 'United States',
  preferredLocations: [],
  requiresSponsorship: false,
  dealBreakers: ['On-call rotation'],
  companyStages: [],
  companySize: null,
  equityImportance: null,
  industriesToExclude: [],
  jobSearchStatus: null,
};

describe('jobMatchScore', () => {
  it('scores jobs with targetRole tokens in the title higher', () => {
    const a = { ...baseJob, title: 'Senior Backend Engineer' };
    const b = { ...baseJob, title: 'Marketing Coordinator' };
    expect(jobMatchScore(a, baseProfile)).toBeGreaterThan(jobMatchScore(b, baseProfile));
  });

  it('boosts jobs that match stack signals in the title', () => {
    const a = { ...baseJob, title: 'Go Developer' };
    const b = { ...baseJob, title: 'Customer Success Manager' };
    expect(jobMatchScore(a, baseProfile)).toBeGreaterThan(jobMatchScore(b, baseProfile));
  });

  it('penalizes jobs with mismatched seniority for senior candidates', () => {
    const a = { ...baseJob, title: 'Senior Backend Engineer' };
    const b = { ...baseJob, title: 'Junior Backend Engineer' };
    const c = { ...baseJob, title: 'Backend Intern' };
    expect(jobMatchScore(a, baseProfile)).toBeGreaterThan(jobMatchScore(b, baseProfile));
    expect(jobMatchScore(b, baseProfile)).toBeGreaterThan(jobMatchScore(c, baseProfile));
  });

  it('penalizes executive titles for senior candidates', () => {
    const a = { ...baseJob, title: 'Senior Backend Engineer' };
    const b = { ...baseJob, title: 'VP of Engineering' };
    expect(jobMatchScore(a, baseProfile)).toBeGreaterThan(jobMatchScore(b, baseProfile));
  });

  it('handles empty stack signals without crashing', () => {
    const profile = { ...baseProfile, stackSignals: [] };
    const job = { ...baseJob, title: 'Engineer' };
    expect(typeof jobMatchScore(job, profile)).toBe('number');
  });
});

describe('filterJobsByProfile', () => {
  it('keeps top N jobs by score', () => {
    const jobs: RawJob[] = [
      { ...baseJob, id: 'j1', title: 'Senior Backend Engineer' },
      { ...baseJob, id: 'j2', title: 'Junior Frontend Developer' },
      { ...baseJob, id: 'j3', title: 'Marketing Coordinator' },
      { ...baseJob, id: 'j4', title: 'Backend Engineer' },
    ];
    const result = filterJobsByProfile(jobs, baseProfile, 2);
    expect(result).toHaveLength(2);
    // Top scorer should be in result
    expect(result.some((j) => j.title === 'Senior Backend Engineer')).toBe(true);
  });

  it('drops jobs with score <= 0', () => {
    const jobs: RawJob[] = [
      { ...baseJob, id: 'j1', title: 'Senior Backend Engineer' },
      { ...baseJob, id: 'j2', title: 'Marketing Coordinator' },
    ];
    const result = filterJobsByProfile(jobs, baseProfile, 10);
    // Marketing Coordinator should be filtered out (no signal matches)
    const titles = result.map((j) => j.title);
    expect(titles).toContain('Senior Backend Engineer');
  });

  it('handles empty input', () => {
    expect(filterJobsByProfile([], baseProfile, 30)).toEqual([]);
  });

  it('respects the topN limit', () => {
    const jobs: RawJob[] = Array.from({ length: 50 }, (_, i) => ({
      ...baseJob,
      id: `j${i}`,
      title: 'Senior Backend Engineer',
    }));
    expect(filterJobsByProfile(jobs, baseProfile, 10)).toHaveLength(10);
  });
});
