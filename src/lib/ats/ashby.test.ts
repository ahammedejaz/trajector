import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchAshbyJobs } from './ashby';

function mockFetch(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({ ok, status, json: async () => body });
}

const SAMPLE = {
  jobs: [
    {
      id: 'd3bc1ced-3ce4-4086-a050-555055dbb1ff',
      title: 'Senior / Staff Fullstack Engineer',
      department: 'Product',
      team: 'Engineering',
      location: 'Europe',
      isRemote: true,
      workplaceType: 'Remote',
      jobUrl: 'https://jobs.ashbyhq.com/linear/d3bc1ced-3ce4-4086-a050-555055dbb1ff',
      applyUrl: 'https://jobs.ashbyhq.com/linear/d3bc1ced-3ce4-4086-a050-555055dbb1ff/application',
      descriptionPlain: 'At Linear, we are building...',
      publishedAt: '2021-04-27T20:13:45.158+00:00',
    },
    {
      id: 'cd5ae036-0223-427a-b038-ba16ef9dcb32',
      title: 'Senior Product Engineer',
      department: 'Product',
      location: 'North America',
      isRemote: true,
      workplaceType: 'Remote',
      jobUrl: 'https://jobs.ashbyhq.com/linear/cd5ae036',
      applyUrl: 'https://jobs.ashbyhq.com/linear/cd5ae036/application',
      descriptionPlain: 'Build great UX.',
      publishedAt: '2021-08-18T20:48:26.891+00:00',
    },
  ],
};

describe('fetchAshbyJobs', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('hits the right URL', async () => {
    let calledUrl = '';
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => {
      calledUrl = url;
      return { ok: true, status: 200, json: async () => SAMPLE };
    }));
    await fetchAshbyJobs('linear', 'Linear');
    expect(calledUrl).toBe('https://api.ashbyhq.com/posting-api/job-board/linear');
  });

  it('returns normalized RawJobs with prefixed ids', async () => {
    vi.stubGlobal('fetch', mockFetch(SAMPLE));
    const jobs = await fetchAshbyJobs('linear', 'Linear');
    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toMatchObject({
      id: 'ashby:linear:d3bc1ced-3ce4-4086-a050-555055dbb1ff',
      source: 'ashby',
      company: 'Linear',
      title: 'Senior / Staff Fullstack Engineer',
      location: 'Europe',
      applyUrl: 'https://jobs.ashbyhq.com/linear/d3bc1ced-3ce4-4086-a050-555055dbb1ff/application',
      department: 'Product',
      updatedAt: '2021-04-27T20:13:45.158+00:00',
    });
    expect(jobs[0].description).toContain('At Linear');
  });

  it('uses descriptionPlain directly without HTML stripping', async () => {
    vi.stubGlobal('fetch', mockFetch({
      jobs: [{
        id: '1', title: 'T', location: 'Remote', applyUrl: 'https://x',
        descriptionPlain: 'Plain text\n\nWith newlines',
      }],
    }));
    const jobs = await fetchAshbyJobs('test', 'Test');
    expect(jobs[0].description).toBe('Plain text\n\nWith newlines');
  });

  it('handles missing fields gracefully', async () => {
    vi.stubGlobal('fetch', mockFetch({
      jobs: [{ id: '99', title: 'Title', applyUrl: 'https://x' }],
    }));
    const jobs = await fetchAshbyJobs('test', 'Test');
    expect(jobs[0]).toMatchObject({
      id: 'ashby:test:99',
      title: 'Title',
      location: 'Remote',
      department: null,
      updatedAt: null,
      description: '',
    });
  });

  it('throws on non-OK response', async () => {
    vi.stubGlobal('fetch', mockFetch({}, false, 404));
    await expect(fetchAshbyJobs('nonexistent', 'X')).rejects.toThrow(/Ashby.*404/);
  });

  it('returns empty array when jobs field is missing', async () => {
    vi.stubGlobal('fetch', mockFetch({}));
    const jobs = await fetchAshbyJobs('empty', 'Empty');
    expect(jobs).toEqual([]);
  });
});
