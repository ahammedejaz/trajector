import { describe, it, expect } from 'vitest';
import { locationMatchesProfile, filterByLocation, isRemoteLocation, locationInCountry } from './locationMatch';
import type { Profile } from '../types';
import type { RawJob } from './ats/types';

const baseProfile: Profile = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  yearsOfExperience: 7,
  stackSignals: ['Go'],
  employmentTypes: ['full-time'],
  compFloor: 200000,
  locationPreference: 'remote',
  country: 'India',
  preferredLocations: [],
  requiresSponsorship: false,
  dealBreakers: [],
  companyStages: [],
  companySize: null,
  equityImportance: null,
  industriesToExclude: [],
  jobSearchStatus: null,
};

const baseJob: RawJob = {
  id: 'test:job',
  source: 'greenhouse',
  company: 'Test',
  title: 'Engineer',
  location: '',
  description: '',
  applyUrl: 'https://x',
  department: null,
  updatedAt: null,
};

describe('isRemoteLocation', () => {
  it('matches plain Remote', () => {
    expect(isRemoteLocation('Remote')).toBe(true);
    expect(isRemoteLocation('remote')).toBe(true);
  });

  it('matches Remote with parens or qualifiers', () => {
    expect(isRemoteLocation('Remote (US)')).toBe(true);
    expect(isRemoteLocation('Remote, USA')).toBe(true);
    expect(isRemoteLocation('Remote — Anywhere')).toBe(true);
  });

  it('matches alternative remote phrases', () => {
    expect(isRemoteLocation('Anywhere')).toBe(true);
    expect(isRemoteLocation('Global')).toBe(true);
    expect(isRemoteLocation('Distributed')).toBe(true);
    expect(isRemoteLocation('WFH')).toBe(true);
    expect(isRemoteLocation('Work from home')).toBe(true);
    expect(isRemoteLocation('Work-from-home')).toBe(true);
  });

  it('does not match in-office locations', () => {
    expect(isRemoteLocation('San Francisco, CA')).toBe(false);
    expect(isRemoteLocation('Bangalore')).toBe(false);
    expect(isRemoteLocation('London, UK')).toBe(false);
  });
});

describe('locationInCountry', () => {
  it('matches direct country name', () => {
    expect(locationInCountry('Bangalore, India', 'India')).toBe(true);
    expect(locationInCountry('Remote, India', 'India')).toBe(true);
  });

  it('matches country aliases', () => {
    expect(locationInCountry('San Francisco, USA', 'United States')).toBe(true);
    expect(locationInCountry('Remote (US)', 'United States')).toBe(true);
    expect(locationInCountry('London, UK', 'United Kingdom')).toBe(true);
  });

  it('matches cities mapped to a country', () => {
    expect(locationInCountry('Bengaluru', 'India')).toBe(true);
    expect(locationInCountry('Hyderabad', 'India')).toBe(true);
    expect(locationInCountry('Pune', 'India')).toBe(true);
    expect(locationInCountry('London', 'United Kingdom')).toBe(true);
    expect(locationInCountry('Toronto', 'Canada')).toBe(true);
  });

  it('does not match unrelated locations', () => {
    expect(locationInCountry('San Francisco, USA', 'India')).toBe(false);
    expect(locationInCountry('Berlin, Germany', 'India')).toBe(false);
    expect(locationInCountry('Bangalore, India', 'United States')).toBe(false);
  });

  it('matches case-insensitively', () => {
    expect(locationInCountry('BANGALORE', 'india')).toBe(true);
    expect(locationInCountry('mumbai', 'India')).toBe(true);
  });
});

describe('locationMatchesProfile — remote', () => {
  it('accepts a remote job when user wants remote (any country)', () => {
    expect(locationMatchesProfile('Remote', baseProfile)).toBe(true);
    expect(locationMatchesProfile('Remote (US)', baseProfile)).toBe(true);
  });

  it('accepts an in-country job when user wants remote', () => {
    expect(locationMatchesProfile('Bangalore, India', baseProfile)).toBe(true);
  });

  it('rejects an off-country onsite job when user wants remote', () => {
    expect(locationMatchesProfile('San Francisco, CA', baseProfile)).toBe(false);
    expect(locationMatchesProfile('London, UK', baseProfile)).toBe(false);
  });
});

describe('locationMatchesProfile — onsite', () => {
  const onsiteProfile: Profile = { ...baseProfile, locationPreference: 'onsite' };

  it('accepts only in-country jobs', () => {
    expect(locationMatchesProfile('Bangalore', onsiteProfile)).toBe(true);
    expect(locationMatchesProfile('Hyderabad, India', onsiteProfile)).toBe(true);
  });

  it('rejects remote jobs', () => {
    expect(locationMatchesProfile('Remote', onsiteProfile)).toBe(false);
    expect(locationMatchesProfile('Remote (US)', onsiteProfile)).toBe(false);
  });

  it('rejects off-country jobs', () => {
    expect(locationMatchesProfile('San Francisco', onsiteProfile)).toBe(false);
  });
});

describe('locationMatchesProfile — hybrid', () => {
  const hybridProfile: Profile = { ...baseProfile, locationPreference: 'hybrid' };

  it('accepts in-country jobs', () => {
    expect(locationMatchesProfile('Bangalore', hybridProfile)).toBe(true);
  });

  it('rejects pure-remote jobs (hybrid needs an office to commute to)', () => {
    expect(locationMatchesProfile('Remote', hybridProfile)).toBe(false);
  });
});

describe('locationMatchesProfile — flexible', () => {
  const flexibleProfile: Profile = { ...baseProfile, locationPreference: 'flexible' };

  it('accepts everything', () => {
    expect(locationMatchesProfile('Remote', flexibleProfile)).toBe(true);
    expect(locationMatchesProfile('San Francisco', flexibleProfile)).toBe(true);
    expect(locationMatchesProfile('Berlin, Germany', flexibleProfile)).toBe(true);
    expect(locationMatchesProfile('Bangalore', flexibleProfile)).toBe(true);
  });
});

describe('locationMatchesProfile — preferredLocations override', () => {
  const profileWithPrefs: Profile = {
    ...baseProfile,
    locationPreference: 'onsite',
    country: 'India',
    preferredLocations: ['Tokyo', 'Singapore'],
  };

  it('accepts a job in a preferred city even outside the user country', () => {
    expect(locationMatchesProfile('Tokyo, Japan', profileWithPrefs)).toBe(true);
    expect(locationMatchesProfile('Singapore', profileWithPrefs)).toBe(true);
  });

  it('still accepts in-country jobs', () => {
    expect(locationMatchesProfile('Bangalore', profileWithPrefs)).toBe(true);
  });

  it('rejects jobs that are neither in country nor in preferred cities', () => {
    expect(locationMatchesProfile('San Francisco', profileWithPrefs)).toBe(false);
  });
});

describe('locationMatchesProfile — no country set', () => {
  const noCountry: Profile = { ...baseProfile, country: null };

  it('with remote preference, accepts only remote', () => {
    expect(locationMatchesProfile('Remote', noCountry)).toBe(true);
    expect(locationMatchesProfile('San Francisco', noCountry)).toBe(false);
  });
});

describe('filterByLocation', () => {
  it('drops jobs that fail the match', () => {
    const jobs: RawJob[] = [
      { ...baseJob, id: 'a', location: 'Bangalore, India' },
      { ...baseJob, id: 'b', location: 'San Francisco, CA' },
      { ...baseJob, id: 'c', location: 'Remote' },
      { ...baseJob, id: 'd', location: 'London, UK' },
    ];
    const result = filterByLocation(jobs, baseProfile);
    const ids = result.map((j) => j.id).sort();
    expect(ids).toEqual(['a', 'c']);  // India + Remote, not US/UK
  });

  it('returns empty when no jobs match', () => {
    const jobs: RawJob[] = [
      { ...baseJob, id: 'a', location: 'San Francisco, CA' },
      { ...baseJob, id: 'b', location: 'Berlin, Germany' },
    ];
    expect(filterByLocation(jobs, { ...baseProfile, locationPreference: 'onsite' })).toEqual([]);
  });
});
