import type { Profile } from '../types';
import type { RawJob } from './ats/types';

const REMOTE_PATTERN = /\b(remote|anywhere|global|distributed|wfh|work[\s-]?from[\s-]?home)\b/i;

/**
 * Aliases the country can appear under in a job posting's location string.
 * Always include the canonical name as the first entry.
 */
const COUNTRY_ALIASES: Record<string, string[]> = {
  'united states': ['united states', 'usa', 'us', 'u.s.', 'u.s.a', 'america'],
  'united kingdom': ['united kingdom', 'uk', 'u.k.', 'britain', 'england'],
  india: ['india'],
  canada: ['canada'],
  germany: ['germany', 'deutschland'],
  france: ['france'],
  spain: ['spain', 'españa', 'espana'],
  netherlands: ['netherlands', 'holland'],
  australia: ['australia'],
  singapore: ['singapore'],
  ireland: ['ireland'],
  brazil: ['brazil', 'brasil'],
  italy: ['italy', 'italia'],
  poland: ['poland'],
  portugal: ['portugal'],
  sweden: ['sweden'],
  norway: ['norway'],
  denmark: ['denmark'],
  switzerland: ['switzerland'],
  japan: ['japan'],
  'south korea': ['south korea', 'korea'],
  mexico: ['mexico'],
  argentina: ['argentina'],
  'united arab emirates': ['united arab emirates', 'uae', 'u.a.e.'],
};

/**
 * Major cities mapped to their country, so a job listed in just a city still
 * matches the user's country preference. Lower-case lookup keys.
 */
const CITIES_BY_COUNTRY: Record<string, string[]> = {
  'united states': [
    'san francisco', 'sf', 'new york', 'nyc', 'seattle', 'los angeles', 'la',
    'boston', 'austin', 'chicago', 'denver', 'atlanta', 'miami', 'portland',
    'philadelphia', 'minneapolis', 'pittsburgh', 'washington d.c.', 'd.c.',
    'san jose', 'palo alto', 'mountain view', 'menlo park',
  ],
  'united kingdom': [
    'london', 'manchester', 'edinburgh', 'birmingham', 'bristol', 'cambridge',
    'glasgow', 'leeds', 'oxford',
  ],
  india: [
    'bangalore', 'bengaluru', 'mumbai', 'delhi', 'new delhi', 'gurgaon',
    'gurugram', 'hyderabad', 'chennai', 'pune', 'noida', 'kolkata', 'ahmedabad',
  ],
  canada: ['toronto', 'vancouver', 'montreal', 'ottawa', 'calgary', 'waterloo'],
  germany: ['berlin', 'munich', 'münchen', 'hamburg', 'frankfurt', 'cologne', 'köln'],
  france: ['paris', 'lyon', 'marseille', 'toulouse', 'nice'],
  spain: ['madrid', 'barcelona', 'valencia', 'seville'],
  netherlands: ['amsterdam', 'rotterdam', 'utrecht', 'the hague'],
  australia: ['sydney', 'melbourne', 'brisbane', 'perth'],
  ireland: ['dublin', 'cork'],
  brazil: ['são paulo', 'sao paulo', 'rio de janeiro', 'brasilia', 'brasília'],
  poland: ['warsaw', 'kraków', 'krakow'],
  portugal: ['lisbon', 'porto'],
  sweden: ['stockholm', 'gothenburg'],
  norway: ['oslo'],
  denmark: ['copenhagen'],
  switzerland: ['zurich', 'zürich', 'geneva'],
  japan: ['tokyo', 'osaka'],
  'south korea': ['seoul'],
  mexico: ['mexico city', 'guadalajara'],
  argentina: ['buenos aires'],
  'united arab emirates': ['dubai', 'abu dhabi'],
  italy: ['milan', 'rome', 'roma'],
  singapore: ['singapore'],
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Tests whether a location string indicates remote work.
 * Matches "Remote", "Anywhere", "Global", "Distributed", "WFH",
 * "Work from home" / "Work-from-home" anywhere in the location string.
 */
export function isRemoteLocation(location: string): boolean {
  return REMOTE_PATTERN.test(location);
}

/**
 * Tests whether a location string belongs to the given country, by name,
 * alias, or known city.
 */
export function locationInCountry(location: string, country: string): boolean {
  const loc = location.toLowerCase();
  const c = country.toLowerCase();

  const aliases = COUNTRY_ALIASES[c] ?? [c];
  for (const alias of aliases) {
    const re = new RegExp(`\\b${escapeRegex(alias)}\\b`, 'i');
    if (re.test(loc)) return true;
  }

  const cities = CITIES_BY_COUNTRY[c] ?? [];
  for (const city of cities) {
    const re = new RegExp(`\\b${escapeRegex(city)}\\b`, 'i');
    if (re.test(loc)) return true;
  }

  return false;
}

/**
 * Decides whether a job's location is acceptable given the user's profile.
 * Honors profile.locationPreference (remote / hybrid / onsite / flexible),
 * profile.country, and profile.preferredLocations.
 *
 * Rules:
 * - flexible          → always pass
 * - remote            → remote jobs OR jobs in user's country / preferred cities
 * - hybrid / onsite   → only jobs in user's country / preferred cities (remote alone won't do)
 * - no country set    → fall back to remote-only filter for "remote" pref; pass otherwise
 */
export function locationMatchesProfile(jobLocation: string, profile: Profile): boolean {
  if (profile.locationPreference === 'flexible') return true;

  // Allow profile.preferredLocations to act as an explicit allowlist that bypasses country logic.
  if (profile.preferredLocations.length > 0) {
    const loc = jobLocation.toLowerCase();
    const prefMatch = profile.preferredLocations.some((p) =>
      loc.includes(p.toLowerCase()),
    );
    if (prefMatch) return true;
  }

  if (!profile.country) {
    if (profile.locationPreference === 'remote') return isRemoteLocation(jobLocation);
    return true;
  }

  const remote = isRemoteLocation(jobLocation);
  const inCountry = locationInCountry(jobLocation, profile.country);

  switch (profile.locationPreference) {
    case 'remote':
      return remote || inCountry;
    case 'hybrid':
    case 'onsite':
      return inCountry;
  }
}

/**
 * Drops jobs whose location is incompatible with the user's profile.
 * Runs before LLM scoring so off-country jobs never reach the model.
 */
export function filterByLocation(jobs: RawJob[], profile: Profile): RawJob[] {
  return jobs.filter((j) => locationMatchesProfile(j.location, profile));
}
