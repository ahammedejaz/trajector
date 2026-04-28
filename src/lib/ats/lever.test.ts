import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchLeverJobs } from './lever';

function mockFetch(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({ ok, status, json: async () => body });
}

const SAMPLE = [
  {
    id: '1ff4a4e3-897c-4eab-9ee2-aa7d1d07a9d6',
    text: 'Senior Backend Engineer',
    categories: {
      department: 'Engineering',
      location: 'Stockholm',
      team: 'Platform',
      commitment: 'Permanent',
    },
    descriptionPlain: 'Build great backend systems.',
    createdAt: 1773335421350,
    hostedUrl: 'https://jobs.lever.co/spotify/1ff4a4e3',
    applyUrl: 'https://jobs.lever.co/spotify/1ff4a4e3/apply',
  },
  {
    id: 'cd5ae036-0223-427a-b038-ba16ef9dcb32',
    text: 'Staff Frontend Engineer',
    categories: {
      department: 'Engineering',
      location: 'Remote',
    },
    descriptionPlain: 'Build great UX.',
    createdAt: 1700000000000,
    hostedUrl: 'https://jobs.lever.co/spotify/cd5ae036',
    applyUrl: 'https://jobs.lever.co/spotify/cd5ae036/apply',
  },
];

describe('fetchLeverJobs', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('hits the right URL', async () => {
    let calledUrl = '';
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => {
      calledUrl = url;
      return { ok: true, status: 200, json: async () => SAMPLE };
    }));
    await fetchLeverJobs('spotify', 'Spotify');
    expect(calledUrl).toBe('https://api.lever.co/v0/postings/spotify');
  });

  it('returns normalized RawJobs with prefixed ids', async () => {
    vi.stubGlobal('fetch', mockFetch(SAMPLE));
    const jobs = await fetchLeverJobs('spotify', 'Spotify');
    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toMatchObject({
      id: 'lever:spotify:1ff4a4e3-897c-4eab-9ee2-aa7d1d07a9d6',
      source: 'lever',
      company: 'Spotify',
      title: 'Senior Backend Engineer',
      location: 'Stockholm',
      applyUrl: 'https://jobs.lever.co/spotify/1ff4a4e3/apply',
      department: 'Engineering',
    });
    expect(jobs[0].description).toContain('Build great backend');
  });

  it('converts createdAt millisecond timestamp to ISO string', async () => {
    vi.stubGlobal('fetch', mockFetch([SAMPLE[1]]));
    const jobs = await fetchLeverJobs('spotify', 'Spotify');
    // 1700000000000 ms is 2023-11-14T22:13:20.000Z
    expect(jobs[0].updatedAt).toBe('2023-11-14T22:13:20.000Z');
  });

  it('handles missing fields gracefully', async () => {
    vi.stubGlobal('fetch', mockFetch([{
      id: 'x',
      text: 'Engineer',
      applyUrl: 'https://x',
    }]));
    const jobs = await fetchLeverJobs('test', 'Test');
    expect(jobs[0]).toMatchObject({
      id: 'lever:test:x',
      title: 'Engineer',
      location: 'Remote',
      department: null,
      updatedAt: null,
      description: '',
    });
  });

  it('falls back to hostedUrl when applyUrl is missing', async () => {
    vi.stubGlobal('fetch', mockFetch([{
      id: 'x',
      text: 'Engineer',
      hostedUrl: 'https://jobs.lever.co/test/x',
    }]));
    const jobs = await fetchLeverJobs('test', 'Test');
    expect(jobs[0].applyUrl).toBe('https://jobs.lever.co/test/x');
  });

  it('throws on non-OK response', async () => {
    vi.stubGlobal('fetch', mockFetch([], false, 404));
    await expect(fetchLeverJobs('nonexistent', 'X')).rejects.toThrow(/Lever.*404/);
  });

  it('returns empty array when response is not an array', async () => {
    vi.stubGlobal('fetch', mockFetch({ jobs: [] }));
    const jobs = await fetchLeverJobs('empty', 'Empty');
    expect(jobs).toEqual([]);
  });
});
