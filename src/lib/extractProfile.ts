import { fetchCompletion } from './openrouter';
import type {
  Profile,
  Level,
  LocationPref,
  EmploymentType,
  CompanyStage,
  CompanySize,
  EquityImportance,
  JobSearchStatus,
} from '../types';

const SYSTEM = `Extract structured profile data from this resume text. Return ONLY valid JSON — no markdown fences, no commentary, just the JSON object.

Schema:
{
  "targetRole": string,
  "level": "junior" | "mid" | "senior" | "staff" | "principal",
  "yearsOfExperience": number | null,
  "stackSignals": string[],
  "employmentTypes": Array<"full-time" | "contract" | "part-time">,
  "compFloor": number | null,
  "locationPreference": "remote" | "hybrid" | "onsite" | "flexible",
  "country": string | null,
  "preferredLocations": string[],
  "requiresSponsorship": boolean,
  "dealBreakers": string[],
  "companyStages": Array<"seed" | "early" | "growth" | "public">,
  "companySize": "startup" | "mid" | "large" | "enterprise" | null,
  "equityImportance": "dealbreaker" | "important" | "nice" | "irrelevant" | null,
  "industriesToExclude": string[],
  "jobSearchStatus": "active" | "open" | "passive" | null
}

Rules:
- targetRole: most recent or desired role title
- level: from years of experience and last title; default "senior"
- yearsOfExperience: integer years from earliest dated role to most recent; null if not derivable
- stackSignals: 5-8 most relevant technical skills/languages/frameworks
- employmentTypes: based on resume signals (e.g. "Independent Contractor" → contract); default ["full-time"]
- compFloor: only if explicitly mentioned; otherwise null
- locationPreference: default "remote" if unclear
- country: parse from address/location lines (e.g. "San Francisco, CA" → "United States"); null if absent
- preferredLocations: any city/region mentioned as a preference; otherwise []
- requiresSponsorship: only true if explicitly stated; otherwise false
- companyStages: only fill if resume names target stages explicitly; otherwise []
- companySize: only if inferable; otherwise null
- equityImportance: only if explicit; otherwise null
- industriesToExclude: only if explicit; otherwise []
- jobSearchStatus: default null unless resume signals urgency`;

const VALID_LEVELS = new Set<Level>(['junior', 'mid', 'senior', 'staff', 'principal']);
const VALID_LOCS = new Set<LocationPref>(['remote', 'hybrid', 'onsite', 'flexible']);
const VALID_EMP = new Set<EmploymentType>(['full-time', 'contract', 'part-time']);
const VALID_STAGE = new Set<CompanyStage>(['seed', 'early', 'growth', 'public']);
const VALID_SIZE = new Set<CompanySize>(['startup', 'mid', 'large', 'enterprise']);
const VALID_EQUITY = new Set<EquityImportance>(['dealbreaker', 'important', 'nice', 'irrelevant']);
const VALID_STATUS = new Set<JobSearchStatus>(['active', 'open', 'passive']);

function pickEnum<T extends string>(raw: unknown, valid: Set<T>, fallback: T | null): T | null {
  return typeof raw === 'string' && valid.has(raw as T) ? (raw as T) : fallback;
}

function pickArray<T extends string>(raw: unknown, valid: Set<T>): T[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is T => typeof v === 'string' && valid.has(v as T));
}

function pickStringArray(raw: unknown, max: number): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((s): s is string => typeof s === 'string').slice(0, max);
}

export async function extractProfile(
  resumeText: string,
  apiKey: string,
  model: string,
): Promise<Profile> {
  const raw = await fetchCompletion(apiKey, model, [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: resumeText },
  ]);

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error('Model returned invalid JSON');
  }

  return {
    targetRole: typeof parsed.targetRole === 'string' ? parsed.targetRole : '',
    level: (pickEnum(parsed.level, VALID_LEVELS, 'senior') ?? 'senior') as Level,
    yearsOfExperience: typeof parsed.yearsOfExperience === 'number' ? parsed.yearsOfExperience : null,
    stackSignals: pickStringArray(parsed.stackSignals, 8),
    employmentTypes: pickArray(parsed.employmentTypes, VALID_EMP),
    compFloor: typeof parsed.compFloor === 'number' ? parsed.compFloor : null,
    locationPreference: (pickEnum(parsed.locationPreference, VALID_LOCS, 'remote') ?? 'remote') as LocationPref,
    country: typeof parsed.country === 'string' && parsed.country.length > 0 ? parsed.country : null,
    preferredLocations: pickStringArray(parsed.preferredLocations, 10),
    requiresSponsorship: parsed.requiresSponsorship === true,
    dealBreakers: pickStringArray(parsed.dealBreakers, 10),
    companyStages: pickArray(parsed.companyStages, VALID_STAGE),
    companySize: pickEnum(parsed.companySize, VALID_SIZE, null) as CompanySize | null,
    equityImportance: pickEnum(parsed.equityImportance, VALID_EQUITY, null) as EquityImportance | null,
    industriesToExclude: pickStringArray(parsed.industriesToExclude, 10),
    jobSearchStatus: pickEnum(parsed.jobSearchStatus, VALID_STATUS, null) as JobSearchStatus | null,
  };
}
