import { fetchCompletion } from './openrouter';
import type { Profile, Level, LocationPref } from '../types';

const SYSTEM = `Extract structured profile data from this resume text. Return ONLY valid JSON — no markdown fences, no commentary, just the JSON object.

Schema:
{
  "targetRole": string,
  "level": "junior" | "mid" | "senior" | "staff" | "principal",
  "compFloor": number | null,
  "location": "remote" | "hybrid" | "onsite",
  "stackSignals": string[],
  "dealBreakers": string[]
}

Rules:
- targetRole: infer the most recent or desired role title
- level: infer from years of experience and last title; default "senior"
- compFloor: extract if mentioned explicitly; otherwise null
- location: default to "remote" if unclear
- stackSignals: 5-8 technical skills, languages, and frameworks most relevant to this candidate
- dealBreakers: only if explicitly mentioned in the resume; otherwise []`;

const VALID_LEVELS = new Set<string>(['junior', 'mid', 'senior', 'staff', 'principal']);
const VALID_LOCATIONS = new Set<string>(['remote', 'hybrid', 'onsite']);

function coerceLevel(raw: unknown): Level {
  const s = String(raw).toLowerCase().trim();
  return VALID_LEVELS.has(s) ? (s as Level) : 'senior';
}

function coerceLocation(raw: unknown): LocationPref {
  const s = String(raw).toLowerCase().trim();
  return VALID_LOCATIONS.has(s) ? (s as LocationPref) : 'remote';
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
    level: coerceLevel(parsed.level),
    compFloor: typeof parsed.compFloor === 'number' ? parsed.compFloor : null,
    location: coerceLocation(parsed.location),
    stackSignals: Array.isArray(parsed.stackSignals)
      ? (parsed.stackSignals as unknown[]).filter((s): s is string => typeof s === 'string').slice(0, 8)
      : [],
    dealBreakers: Array.isArray(parsed.dealBreakers)
      ? (parsed.dealBreakers as unknown[]).filter((s): s is string => typeof s === 'string')
      : [],
  };
}
