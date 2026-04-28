import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scanJobs } from './scanJobs';
import type { Profile, SourceKey } from '../types';
import type { RawJob } from './ats/types';

vi.mock('./ats/fetchAll', () => ({
  fetchAllJobs: vi.fn(),
}));
vi.mock('./ats/filterJobs', () => ({
  filterJobsByProfile: vi.fn(),
}));

import { fetchAllJobs } from './ats/fetchAll';
import { filterJobsByProfile } from './ats/filterJobs';

const PROFILE: Profile = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  yearsOfExperience: 7,
  stackSignals: ['Go', 'PostgreSQL'],
  employmentTypes: ['full-time'],
  compFloor: 200000,
  locationPreference: 'remote',
  country: 'United States',
  preferredLocations: [],
  requiresSponsorship: false,
  dealBreakers: [],
  companyStages: [],
  companySize: null,
  equityImportance: null,
  industriesToExclude: [],
  jobSearchStatus: null,
};

const SOURCES: SourceKey[] = ['greenhouse', 'ashby', 'lever'];

const RAW_JOB: RawJob = {
  id: 'greenhouse:stripe:1',
  source: 'greenhouse',
  company: 'Stripe',
  title: 'Senior Backend Engineer',
  location: 'Remote (US)',
  description: 'Build payment systems at scale.',
  applyUrl: 'https://boards.greenhouse.io/stripe/jobs/1',
  department: 'Engineering',
  updatedAt: '2024-01-15T00:00:00Z',
};

function llmMockReturning(scores: Array<{ id: string; score: number; reason: string }>) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify({ jobs: scores }) } }],
    }),
  });
}

describe('scanJobs (real jobs + LLM scoring)', () => {
  beforeEach(() => {
    vi.mocked(fetchAllJobs).mockResolvedValue({
      jobs: [RAW_JOB],
      stats: { requested: 1, successful: 1, failed: 0, byAts: { greenhouse: 1, ashby: 0, lever: 0 }, errors: [] },
    });
    vi.mocked(filterJobsByProfile).mockReturnValue([RAW_JOB]);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('returns ScoredJob[] with real applyUrl from RawJob', async () => {
    vi.stubGlobal('fetch', llmMockReturning([{ id: RAW_JOB.id, score: 88, reason: 'Strong stack match.' }]));
    const result = await scanJobs(PROFILE, SOURCES, 'sk-or-test', 'anthropic/claude-sonnet-4-6');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: RAW_JOB.id,
      source: 'greenhouse',
      company: 'Stripe',
      title: 'Senior Backend Engineer',
      applyUrl: 'https://boards.greenhouse.io/stripe/jobs/1',
      score: 88,
      scoreReason: 'Strong stack match.',
    });
  });

  it('returns empty array when no companies match enabled sources', async () => {
    const result = await scanJobs(PROFILE, [] as SourceKey[], 'k', 'm');
    expect(result).toEqual([]);
    expect(fetchAllJobs).not.toHaveBeenCalled();
  });

  it('returns empty array when no jobs survive title pre-filter', async () => {
    vi.mocked(filterJobsByProfile).mockReturnValue([]);
    vi.stubGlobal('fetch', vi.fn());
    const result = await scanJobs(PROFILE, SOURCES, 'k', 'm');
    expect(result).toEqual([]);
  });

  it('passes only filtered jobs to the LLM, not all fetched jobs', async () => {
    let capturedBody: string | null = null;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
      capturedBody = init.body as string;
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ jobs: [{ id: RAW_JOB.id, score: 80, reason: 'r' }] }) } }],
        }),
      };
    }));
    await scanJobs(PROFILE, SOURCES, 'k', 'm');
    expect(capturedBody).toContain(RAW_JOB.id);
    expect(capturedBody).toContain('Senior Backend Engineer');
  });

  it('clamps LLM scores to 0-100', async () => {
    vi.stubGlobal('fetch', llmMockReturning([{ id: RAW_JOB.id, score: 150, reason: 'r' }]));
    const result = await scanJobs(PROFILE, SOURCES, 'k', 'm');
    expect(result[0].score).toBe(100);
  });

  it('drops scored entries that do not match any real job id (LLM hallucinated id)', async () => {
    vi.stubGlobal('fetch', llmMockReturning([
      { id: RAW_JOB.id, score: 80, reason: 'real' },
      { id: 'fake:id:999', score: 95, reason: 'hallucinated' },
    ]));
    const result = await scanJobs(PROFILE, SOURCES, 'k', 'm');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(RAW_JOB.id);
  });

  it('throws if LLM returns invalid JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'not json' } }] }),
    }));
    await expect(scanJobs(PROFILE, SOURCES, 'k', 'm')).rejects.toThrow(/Model returned invalid JSON/);
  });

  it('uses RawJob applyUrl, not a templated fallback', async () => {
    vi.stubGlobal('fetch', llmMockReturning([{ id: RAW_JOB.id, score: 80, reason: 'r' }]));
    const result = await scanJobs(PROFILE, SOURCES, 'k', 'm');
    expect(result[0].applyUrl).toBe('https://boards.greenhouse.io/stripe/jobs/1');
  });
});
