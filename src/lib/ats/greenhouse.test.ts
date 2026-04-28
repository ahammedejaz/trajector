import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchGreenhouseJobs } from './greenhouse';

function mockFetch(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  });
}

const SAMPLE_RESPONSE = {
  jobs: [
    {
      id: 12345,
      title: 'Senior Backend Engineer',
      absolute_url: 'https://boards.greenhouse.io/discord/jobs/12345',
      location: { name: 'San Francisco, CA' },
      departments: [{ name: 'Engineering' }],
      content: '<p>Build cool stuff.</p>',
      updated_at: '2024-01-15T00:00:00Z',
    },
    {
      id: 67890,
      title: 'Staff iOS Engineer',
      absolute_url: 'https://boards.greenhouse.io/discord/jobs/67890',
      location: { name: 'Remote, USA' },
      departments: [{ name: 'Mobile' }],
      content: '<p>Build mobile.</p>',
      updated_at: '2024-01-10T00:00:00Z',
    },
  ],
  meta: { total: 2 },
};

describe('fetchGreenhouseJobs', () => {
  beforeEach(() => {});
  afterEach(() => vi.unstubAllGlobals());

  it('hits the right URL with content=true', async () => {
    let calledUrl = '';
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => {
      calledUrl = url;
      return { ok: true, status: 200, json: async () => SAMPLE_RESPONSE };
    }));
    await fetchGreenhouseJobs('discord', 'Discord');
    expect(calledUrl).toBe('https://boards-api.greenhouse.io/v1/boards/discord/jobs?content=true');
  });

  it('returns normalized RawJobs with prefixed ids', async () => {
    vi.stubGlobal('fetch', mockFetch(SAMPLE_RESPONSE));
    const jobs = await fetchGreenhouseJobs('discord', 'Discord');
    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toMatchObject({
      id: 'greenhouse:discord:12345',
      source: 'greenhouse',
      company: 'Discord',
      title: 'Senior Backend Engineer',
      location: 'San Francisco, CA',
      applyUrl: 'https://boards.greenhouse.io/discord/jobs/12345',
      department: 'Engineering',
      updatedAt: '2024-01-15T00:00:00Z',
    });
    expect(jobs[0].description).toBe('Build cool stuff.');
  });

  it('strips HTML tags from content', async () => {
    vi.stubGlobal('fetch', mockFetch({
      jobs: [{
        id: 1,
        title: 'T',
        absolute_url: 'https://x',
        location: { name: 'Remote' },
        departments: [],
        content: '<p>Line 1</p><p>Line 2 <strong>bold</strong></p><ul><li>item</li></ul>',
        updated_at: null,
      }],
    }));
    const jobs = await fetchGreenhouseJobs('test', 'Test');
    expect(jobs[0].description).toContain('Line 1');
    expect(jobs[0].description).toContain('Line 2');
    expect(jobs[0].description).toContain('bold');
    expect(jobs[0].description).not.toContain('<p>');
    expect(jobs[0].description).not.toContain('</p>');
  });

  it('handles missing fields gracefully', async () => {
    vi.stubGlobal('fetch', mockFetch({
      jobs: [{
        id: 99,
        title: 'Title',
        absolute_url: 'https://x',
      }],
    }));
    const jobs = await fetchGreenhouseJobs('test', 'Test');
    expect(jobs[0]).toMatchObject({
      id: 'greenhouse:test:99',
      title: 'Title',
      location: 'Remote',
      department: null,
      updatedAt: null,
      description: '',
    });
  });

  it('decodes HTML entities in description', async () => {
    vi.stubGlobal('fetch', mockFetch({
      jobs: [{
        id: 1, title: 'T', absolute_url: 'https://x', location: { name: 'Remote' }, departments: [],
        content: '&amp; &lt;tag&gt; &quot;quoted&quot; &#39;single&#39; &nbsp;',
      }],
    }));
    const jobs = await fetchGreenhouseJobs('test', 'Test');
    expect(jobs[0].description).toContain('&');
    expect(jobs[0].description).toContain('<tag>');
    expect(jobs[0].description).toContain('"quoted"');
    expect(jobs[0].description).toContain("'single'");
  });

  it('throws on non-OK response', async () => {
    vi.stubGlobal('fetch', mockFetch({}, false, 404));
    await expect(fetchGreenhouseJobs('nonexistent', 'X')).rejects.toThrow(/Greenhouse.*404/);
  });

  it('returns empty array when jobs field is missing', async () => {
    vi.stubGlobal('fetch', mockFetch({ meta: {} }));
    const jobs = await fetchGreenhouseJobs('empty', 'Empty');
    expect(jobs).toEqual([]);
  });
});
