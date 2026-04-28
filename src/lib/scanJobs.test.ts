import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scanJobs } from './scanJobs';
import type { Profile, SourceKey } from '../types';

const PROFILE: Profile = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  yearsOfExperience: null,
  stackSignals: ['Go', 'PostgreSQL'],
  employmentTypes: [],
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

function mockOR(content: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ choices: [{ message: { content: JSON.stringify(content) } }] }),
  });
}

describe('scanJobs', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockOR([]));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('returns parsed jobs from the model', async () => {
    const payload = [
      {
        id: 'j1',
        source: 'greenhouse',
        company: 'Acme',
        title: 'Senior Backend Engineer',
        location: 'Remote',
        compRange: '$220k-$260k',
        description: 'Build scalable Go services.',
        tags: ['Go', 'Postgres'],
        score: 92,
        scoreReason: 'Stack and seniority match.',
        applyUrl: 'https://boards.greenhouse.io/acme/jobs/j1',
        responsibilities: ['Own the backend stack'],
        requirements: ['5+ years Go experience'],
        benefits: ['Remote stipend'],
        experienceYears: '5+ years',
        companyBlurb: 'Acme builds developer tools.',
      },
    ];
    vi.stubGlobal('fetch', mockOR(payload));
    const jobs = await scanJobs(PROFILE, SOURCES, 'sk-or-test', 'anthropic/claude-sonnet-4-6');
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({ id: 'j1', score: 92, source: 'greenhouse' });
  });

  it('clamps scores to 0-100', async () => {
    const payload = [
      { id: 'a', source: 'greenhouse', company: 'A', title: 'T', location: 'Remote', description: 'd', tags: [], score: 150, scoreReason: 'r', applyUrl: '', responsibilities: [], requirements: [], benefits: [], experienceYears: null, companyBlurb: null },
      { id: 'b', source: 'greenhouse', company: 'B', title: 'T', location: 'Remote', description: 'd', tags: [], score: -10, scoreReason: 'r', applyUrl: '', responsibilities: [], requirements: [], benefits: [], experienceYears: null, companyBlurb: null },
    ];
    vi.stubGlobal('fetch', mockOR(payload));
    const jobs = await scanJobs(PROFILE, SOURCES, 'k', 'm');
    expect(jobs[0].score).toBe(100);
    expect(jobs[1].score).toBe(0);
  });

  it('drops records missing required fields', async () => {
    const payload = [
      { id: 'good', source: 'greenhouse', company: 'A', title: 'T', location: 'Remote', description: 'd', tags: [], score: 80, scoreReason: 'r', applyUrl: '', responsibilities: [], requirements: [], benefits: [], experienceYears: null, companyBlurb: null },
      { id: 'bad-no-title', source: 'greenhouse', company: 'A', location: 'Remote', description: 'd', tags: [], score: 80, scoreReason: 'r', applyUrl: '', responsibilities: [], requirements: [], benefits: [], experienceYears: null, companyBlurb: null },
      { source: 'greenhouse', company: 'A', title: 'T', location: 'Remote', description: 'd', tags: [], score: 80, scoreReason: 'r', applyUrl: '', responsibilities: [], requirements: [], benefits: [], experienceYears: null, companyBlurb: null },
    ];
    vi.stubGlobal('fetch', mockOR(payload));
    const jobs = await scanJobs(PROFILE, SOURCES, 'k', 'm');
    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe('good');
  });

  it('dedupes by id', async () => {
    const payload = [
      { id: 'x', source: 'greenhouse', company: 'A', title: 'T', location: 'Remote', description: 'd', tags: [], score: 80, scoreReason: 'r', applyUrl: '', responsibilities: [], requirements: [], benefits: [], experienceYears: null, companyBlurb: null },
      { id: 'x', source: 'greenhouse', company: 'B', title: 'T', location: 'Remote', description: 'd', tags: [], score: 70, scoreReason: 'r', applyUrl: '', responsibilities: [], requirements: [], benefits: [], experienceYears: null, companyBlurb: null },
    ];
    vi.stubGlobal('fetch', mockOR(payload));
    const jobs = await scanJobs(PROFILE, SOURCES, 'k', 'm');
    expect(jobs).toHaveLength(1);
    expect(jobs[0].company).toBe('A');
  });

  it('rewrites unknown source to first enabled source', async () => {
    const payload = [
      { id: 'a', source: 'wellfound', company: 'A', title: 'T', location: 'Remote', description: 'd', tags: [], score: 80, scoreReason: 'r', applyUrl: '', responsibilities: [], requirements: [], benefits: [], experienceYears: null, companyBlurb: null },
    ];
    vi.stubGlobal('fetch', mockOR(payload));
    const jobs = await scanJobs(PROFILE, SOURCES, 'k', 'm');
    expect(jobs[0].source).toBe('greenhouse');
  });

  it('throws if model returns invalid JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'not json' } }] }),
    }));
    await expect(scanJobs(PROFILE, SOURCES, 'k', 'm')).rejects.toThrow('Model returned invalid JSON');
  });

  it('throws if model returns a non-array', async () => {
    vi.stubGlobal('fetch', mockOR({ jobs: [] }));
    await expect(scanJobs(PROFILE, SOURCES, 'k', 'm')).rejects.toThrow('Expected an array of jobs');
  });

  it('passes country in the user message', async () => {
    let capturedBody: string | null = null;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
      capturedBody = init.body as string;
      return {
        ok: true,
        json: async () => ({ choices: [{ message: { content: '[]' } }] }),
      };
    }));
    await scanJobs(PROFILE, SOURCES, 'k', 'm');
    expect(capturedBody).toContain('United States');
  });

  it('falls back to a templated applyUrl when missing', async () => {
    const payload = [
      { id: 'job-1', source: 'greenhouse', company: 'Acme Corp', title: 'T', location: 'Remote', description: 'd', tags: [], score: 80, scoreReason: 'r' },
    ];
    vi.stubGlobal('fetch', mockOR(payload));
    const jobs = await scanJobs(PROFILE, SOURCES, 'k', 'm');
    expect(jobs[0].applyUrl).toBe('https://boards.greenhouse.io/acme-corp/jobs/job-1');
  });

  it('preserves applyUrl from the model when provided', async () => {
    const payload = [
      { id: 'j1', source: 'greenhouse', company: 'C', title: 'T', location: 'Remote', description: 'd', tags: [], score: 80, scoreReason: 'r', applyUrl: 'https://example.com/apply' },
    ];
    vi.stubGlobal('fetch', mockOR(payload));
    const jobs = await scanJobs(PROFILE, SOURCES, 'k', 'm');
    expect(jobs[0].applyUrl).toBe('https://example.com/apply');
  });
});
