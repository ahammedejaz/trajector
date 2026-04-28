import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scanJobs } from './scanJobs';
import type { Profile, SourceKey } from '../types';

const PROFILE: Profile = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  compFloor: 200000,
  location: 'remote',
  stackSignals: ['Go', 'PostgreSQL'],
  dealBreakers: [],
};

const SOURCES: SourceKey[] = ['linkedin', 'greenhouse', 'lever'];

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
        source: 'linkedin',
        company: 'Acme',
        title: 'Senior Backend Engineer',
        location: 'Remote',
        compRange: '$220k-$260k',
        description: 'Build scalable Go services.',
        tags: ['Go', 'Postgres'],
        score: 92,
        scoreReason: 'Stack and seniority match.',
      },
    ];
    vi.stubGlobal('fetch', mockOR(payload));
    const jobs = await scanJobs(PROFILE, SOURCES, 'sk-or-test', 'anthropic/claude-sonnet-4-6');
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({ id: 'j1', score: 92, source: 'linkedin' });
  });

  it('clamps scores to 0-100', async () => {
    const payload = [
      { id: 'a', source: 'linkedin', company: 'A', title: 'T', location: 'Remote', description: 'd', tags: [], score: 150, scoreReason: 'r' },
      { id: 'b', source: 'linkedin', company: 'B', title: 'T', location: 'Remote', description: 'd', tags: [], score: -10, scoreReason: 'r' },
    ];
    vi.stubGlobal('fetch', mockOR(payload));
    const jobs = await scanJobs(PROFILE, SOURCES, 'k', 'm');
    expect(jobs[0].score).toBe(100);
    expect(jobs[1].score).toBe(0);
  });

  it('drops records missing required fields', async () => {
    const payload = [
      { id: 'good', source: 'linkedin', company: 'A', title: 'T', location: 'Remote', description: 'd', tags: [], score: 80, scoreReason: 'r' },
      { id: 'bad-no-title', source: 'linkedin', company: 'A', location: 'Remote', description: 'd', tags: [], score: 80, scoreReason: 'r' },
      { source: 'linkedin', company: 'A', title: 'T', location: 'Remote', description: 'd', tags: [], score: 80, scoreReason: 'r' },
    ];
    vi.stubGlobal('fetch', mockOR(payload));
    const jobs = await scanJobs(PROFILE, SOURCES, 'k', 'm');
    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe('good');
  });

  it('dedupes by id', async () => {
    const payload = [
      { id: 'x', source: 'linkedin', company: 'A', title: 'T', location: 'Remote', description: 'd', tags: [], score: 80, scoreReason: 'r' },
      { id: 'x', source: 'linkedin', company: 'B', title: 'T', location: 'Remote', description: 'd', tags: [], score: 70, scoreReason: 'r' },
    ];
    vi.stubGlobal('fetch', mockOR(payload));
    const jobs = await scanJobs(PROFILE, SOURCES, 'k', 'm');
    expect(jobs).toHaveLength(1);
    expect(jobs[0].company).toBe('A');
  });

  it('rewrites unknown source to first enabled source', async () => {
    const payload = [
      { id: 'a', source: 'wellfound', company: 'A', title: 'T', location: 'Remote', description: 'd', tags: [], score: 80, scoreReason: 'r' },
    ];
    vi.stubGlobal('fetch', mockOR(payload));
    const jobs = await scanJobs(PROFILE, SOURCES, 'k', 'm');
    expect(jobs[0].source).toBe('linkedin');
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
});
