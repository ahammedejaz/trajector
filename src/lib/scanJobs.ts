import { fetchCompletion } from './openrouter';
import type { Profile, ScoredJob, SourceKey } from '../types';
import { fetchAllJobs } from './ats/fetchAll';
import { filterJobsByProfile } from './ats/filterJobs';
import { COMPANIES } from './companies';
import type { RawJob } from './ats/types';

const TOP_N = 20;
const MAX_DESC_CHARS = 600;
const SCORING_MAX_TOKENS = 4096;

const SOURCE_LABELS: Record<SourceKey, string> = {
  greenhouse: 'Greenhouse',
  ashby: 'Ashby',
  lever: 'Lever',
};

export { SOURCE_LABELS };

interface LlmScore {
  id: string;
  score: number;
  reason: string;
}

interface LlmResponse {
  jobs?: LlmScore[];
}

function buildScoringPrompt(): string {
  return `You are a job-search assistant. The user's profile and a JSON array of REAL job postings are provided. Score each job 0-100 for how well it matches the user.

Return ONLY a JSON object — no prose, no markdown fences, no commentary:
{ "jobs": [ { "id": <job.id>, "score": 0-100, "reason": <one sentence> }, ... ] }

Rules:
- "id" must be the EXACT id from the input job. Do NOT invent ids.
- "score" is 0-100; use the full range. Some strong (>=80), some decent (50-79), some skip (<50).
- "reason" is one short sentence justifying the score. Keep it under 20 words.

Scoring factors (in order of weight):
1. Stack alignment — does the job mention the candidate's stackSignals?
2. Seniority alignment — title vs candidate.level
3. Country / location match — job location vs profile.country and profile.locationPreference
4. Sponsorship — if requiresSponsorship is true and the job description excludes sponsorship, score lower
5. Comp — if compFloor is set and comp range is below it (when stated), score lower
6. Company stages / size / equity / industries — soft modifiers
7. Deal-breakers — if any dealBreaker keyword appears in description, score lower

Be honest. Postings that look great should score high; obvious mismatches low. Don't inflate.`;
}

function summarizeJob(j: RawJob): unknown {
  const desc = j.description.length > MAX_DESC_CHARS
    ? j.description.slice(0, MAX_DESC_CHARS) + '…'
    : j.description;
  return {
    id: j.id,
    company: j.company,
    title: j.title,
    location: j.location,
    department: j.department,
    description: desc,
  };
}

function clampScore(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Lenient JSON extraction. LLMs sometimes wrap JSON in markdown fences
 * or add preamble/postamble text even when told not to. We strip fences
 * and slice from first `{` to last `}` before parsing.
 */
function extractJson(raw: string): unknown {
  let text = raw.trim();
  // Strip ```json ... ``` or ``` ... ``` fences if present
  const fenceMatch = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }
  // If the text still has surrounding noise, slice to the outermost braces.
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last > first) {
    text = text.slice(first, last + 1);
  }
  return JSON.parse(text);
}

export async function scanJobs(
  profile: Profile,
  enabledSources: SourceKey[],
  apiKey: string,
  model: string,
): Promise<ScoredJob[]> {
  if (enabledSources.length === 0) return [];
  const enabledSet = new Set<SourceKey>(enabledSources);
  const enabledCompanies = COMPANIES.filter((c) => enabledSet.has(c.ats));
  if (enabledCompanies.length === 0) return [];

  const fetched = await fetchAllJobs(enabledCompanies);
  const filtered = filterJobsByProfile(fetched.jobs, profile, TOP_N);
  if (filtered.length === 0) return [];

  const system = buildScoringPrompt();
  const user = JSON.stringify(
    {
      profile,
      jobs: filtered.map(summarizeJob),
    },
    null,
    2,
  );

  const raw = await fetchCompletion(
    apiKey,
    model,
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    {
      maxTokens: SCORING_MAX_TOKENS,
      jsonResponse: true,
    },
  );

  let parsed: LlmResponse;
  try {
    parsed = extractJson(raw) as LlmResponse;
  } catch {
    throw new Error('Model returned invalid JSON');
  }

  const scoresById = new Map<string, LlmScore>();
  if (Array.isArray(parsed.jobs)) {
    for (const s of parsed.jobs) {
      if (s && typeof s.id === 'string') {
        scoresById.set(s.id, s);
      }
    }
  }

  const scored: ScoredJob[] = [];
  for (const j of filtered) {
    const s = scoresById.get(j.id);
    if (!s) continue;
    scored.push({
      id: j.id,
      source: j.source,
      company: j.company,
      title: j.title,
      location: j.location,
      compRange: null,
      description: j.description,
      tags: j.department ? [j.department] : [],
      score: clampScore(s.score),
      scoreReason: typeof s.reason === 'string' ? s.reason : '',
      applyUrl: j.applyUrl,
      responsibilities: [],
      requirements: [],
      benefits: [],
      experienceYears: null,
      companyBlurb: null,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}
