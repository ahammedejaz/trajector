import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractProfile } from './extractProfile';

function mockOR(content: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ choices: [{ message: { content: typeof content === 'string' ? content : JSON.stringify(content) } }] }),
  });
}

const PAYLOAD = {
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
  companyStages: ['growth', 'public'],
  companySize: 'mid',
  equityImportance: 'nice',
  industriesToExclude: [],
  jobSearchStatus: 'open',
};

describe('extractProfile', () => {
  beforeEach(() => vi.stubGlobal('fetch', mockOR(PAYLOAD)));
  afterEach(() => vi.unstubAllGlobals());

  it('returns a fully populated Profile', async () => {
    const p = await extractProfile('resume text', 'k', 'm');
    expect(p).toMatchObject({
      targetRole: 'Senior Backend Engineer',
      level: 'senior',
      yearsOfExperience: 7,
      stackSignals: ['Go', 'PostgreSQL'],
      employmentTypes: ['full-time'],
      compFloor: 200000,
      locationPreference: 'remote',
      country: 'United States',
      requiresSponsorship: false,
      companyStages: ['growth', 'public'],
      companySize: 'mid',
      equityImportance: 'nice',
      jobSearchStatus: 'open',
    });
  });

  it('defaults missing fields safely', async () => {
    vi.stubGlobal('fetch', mockOR({}));
    const p = await extractProfile('resume', 'k', 'm');
    expect(p).toMatchObject({
      targetRole: '',
      level: 'senior',
      yearsOfExperience: null,
      stackSignals: [],
      employmentTypes: [],
      compFloor: null,
      locationPreference: 'remote',
      country: null,
      preferredLocations: [],
      requiresSponsorship: false,
      dealBreakers: [],
      companyStages: [],
      companySize: null,
      equityImportance: null,
      industriesToExclude: [],
      jobSearchStatus: null,
    });
  });

  it('coerces invalid level to senior', async () => {
    vi.stubGlobal('fetch', mockOR({ ...PAYLOAD, level: 'godlike' }));
    const p = await extractProfile('resume', 'k', 'm');
    expect(p.level).toBe('senior');
  });

  it('coerces invalid locationPreference to remote', async () => {
    vi.stubGlobal('fetch', mockOR({ ...PAYLOAD, locationPreference: 'lunar' }));
    const p = await extractProfile('resume', 'k', 'm');
    expect(p.locationPreference).toBe('remote');
  });

  it('filters invalid employmentTypes', async () => {
    vi.stubGlobal('fetch', mockOR({ ...PAYLOAD, employmentTypes: ['full-time', 'freelance', 'contract'] }));
    const p = await extractProfile('resume', 'k', 'm');
    expect(p.employmentTypes).toEqual(['full-time', 'contract']);
  });

  it('filters invalid companyStages', async () => {
    vi.stubGlobal('fetch', mockOR({ ...PAYLOAD, companyStages: ['series-A', 'growth', 'pre-IPO'] }));
    const p = await extractProfile('resume', 'k', 'm');
    expect(p.companyStages).toEqual(['growth']);
  });

  it('coerces invalid companySize to null', async () => {
    vi.stubGlobal('fetch', mockOR({ ...PAYLOAD, companySize: 'medium-large' }));
    const p = await extractProfile('resume', 'k', 'm');
    expect(p.companySize).toBeNull();
  });

  it('throws on invalid JSON', async () => {
    vi.stubGlobal('fetch', mockOR('not json'));
    await expect(extractProfile('resume', 'k', 'm')).rejects.toThrow('Model returned invalid JSON');
  });
});
