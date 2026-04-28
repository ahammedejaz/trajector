import { fetchCompletion } from './openrouter';
import type { Profile, ScoredJob, SourceKey } from '../types';
import { fetchAllJobs } from './ats/fetchAll';
import { filterJobsByProfile } from './ats/filterJobs';
import { COMPANIES } from './companies';
import type { RawJob } from './ats/types';

const TOP_N = 30;
const MAX_DESC_CHARS = 2000;

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
  return `You are a job-search assistant. The user's profile is provided as JSON. Below it is a JSON array of REAL job postings fetched from public APIs. Score each job 0-100 for how well it matches the user.

Return ONLY a JSON object: { "jobs": [ { "id": <job.id>, "score": 0-100, "reason": <one sentence> }, ... ] }
- "id" must be the EXACT id from the input job. Do NOT invent ids.
- "score" is 0-100; use the full range. ~4 strong (>=80), ~12 decent (50-79), the rest can be skip (<50).
- "reason" is one short sentence justifying the score.

Scoring factors (in order of weight):
1. Stack alignment — does the job mention the candidate's stackSignals?
2. Seniority alignment — title vs candidate.level
3. Country / location match — job location vs profile.country and profile.locationPreference
4. Sponsorship — if requiresSponsorship is true and the job description excludes sponsorship, score lower
5. Comp — if compFloor is set and comp range is below it (when stated), score lower
6. Company stages / size / equity / industries — soft modifiers
7. Deal-breakers — if any dealBreaker keyword appears in description, score lower

Be honest. Postings that look great should score high; obvious mismatches low. The user trusts that low scores are skipped, so don't inflate.`;
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

  const raw = await fetchCompletion(apiKey, model, [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]);

  let parsed: LlmResponse;
  try {
    parsed = JSON.parse(raw) as LlmResponse;
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
