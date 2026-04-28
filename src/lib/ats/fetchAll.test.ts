import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchAllJobs } from './fetchAll';
import type { RawJob } from './types';

const ghJobs: RawJob[] = [
  { id: 'greenhouse:stripe:1', source: 'greenhouse', company: 'Stripe', title: 'Backend', location: 'Remote', description: 'd', applyUrl: 'https://x', department: null, updatedAt: null },
];
const ashJobs: RawJob[] = [
  { id: 'ashby:linear:2', source: 'ashby', company: 'Linear', title: 'Frontend', location: 'Remote', description: 'd', applyUrl: 'https://x', department: null, updatedAt: null },
];
const lvJobs: RawJob[] = [
  { id: 'lever:spotify:3', source: 'lever', company: 'Spotify', title: 'Mobile', location: 'Remote', description: 'd', applyUrl: 'https://x', department: null, updatedAt: null },
];

vi.mock('./greenhouse', () => ({ fetchGreenhouseJobs: vi.fn() }));
vi.mock('./ashby', () => ({ fetchAshbyJobs: vi.fn() }));
vi.mock('./lever', () => ({ fetchLeverJobs: vi.fn() }));

import { fetchGreenhouseJobs } from './greenhouse';
import { fetchAshbyJobs } from './ashby';
import { fetchLeverJobs } from './lever';

const TEST_COMPANIES = [
  { name: 'Stripe', ats: 'greenhouse' as const, slug: 'stripe' },
  { name: 'Linear', ats: 'ashby' as const, slug: 'linear' },
  { name: 'Spotify', ats: 'lever' as const, slug: 'spotify' },
];

describe('fetchAllJobs', () => {
  beforeEach(() => {
    vi.mocked(fetchGreenhouseJobs).mockResolvedValue(ghJobs);
    vi.mocked(fetchAshbyJobs).mockResolvedValue(ashJobs);
    vi.mocked(fetchLeverJobs).mockResolvedValue(lvJobs);
  });
  afterEach(() => vi.clearAllMocks());

  it('fetches all enabled companies in parallel and merges results', async () => {
    const result = await fetchAllJobs(TEST_COMPANIES);
    expect(result.jobs).toHaveLength(3);
    expect(result.jobs.some((j) => j.source === 'greenhouse')).toBe(true);
    expect(result.jobs.some((j) => j.source === 'ashby')).toBe(true);
    expect(result.jobs.some((j) => j.source === 'lever')).toBe(true);
  });

  it('reports per-company stats', async () => {
    const result = await fetchAllJobs(TEST_COMPANIES);
    expect(result.stats.successful).toBe(3);
    expect(result.stats.failed).toBe(0);
    expect(result.stats.byAts.greenhouse).toBe(1);
    expect(result.stats.byAts.ashby).toBe(1);
    expect(result.stats.byAts.lever).toBe(1);
  });

  it('continues on per-company failures and reports them', async () => {
    vi.mocked(fetchGreenhouseJobs).mockRejectedValueOnce(new Error('500'));
    const result = await fetchAllJobs(TEST_COMPANIES);
    expect(result.stats.successful).toBe(2);
    expect(result.stats.failed).toBe(1);
    expect(result.stats.errors).toHaveLength(1);
    expect(result.stats.errors[0].company).toBe('Stripe');
    expect(result.jobs).toHaveLength(2);
  });

  it('dispatches the right fetcher per ATS type', async () => {
    await fetchAllJobs(TEST_COMPANIES);
    expect(fetchGreenhouseJobs).toHaveBeenCalledWith('stripe', 'Stripe');
    expect(fetchAshbyJobs).toHaveBeenCalledWith('linear', 'Linear');
    expect(fetchLeverJobs).toHaveBeenCalledWith('spotify', 'Spotify');
  });

  it('handles empty company list', async () => {
    const result = await fetchAllJobs([]);
    expect(result.jobs).toEqual([]);
    expect(result.stats.successful).toBe(0);
  });
});
