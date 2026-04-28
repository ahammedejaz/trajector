import { describe, it, expect, beforeEach } from 'vitest';
import { loadProfile, saveProfile } from './profileStore';
import type { Profile } from '../types';

const SAMPLE: Profile = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  yearsOfExperience: 7,
  stackSignals: ['Go'],
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

describe('profileStore', () => {
  beforeEach(() => localStorage.clear());

  it('returns null when nothing saved', () => {
    expect(loadProfile()).toBeNull();
  });

  it('roundtrips a saved profile', () => {
    saveProfile(SAMPLE);
    expect(loadProfile()).toEqual(SAMPLE);
  });

  it('returns null on malformed JSON', () => {
    localStorage.setItem('trajector_profile', 'not json');
    expect(loadProfile()).toBeNull();
  });
});
