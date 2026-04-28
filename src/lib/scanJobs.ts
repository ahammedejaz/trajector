import { fetchCompletion } from './openrouter';
import type { Profile, ScoredJob, SourceKey } from '../types';

const SOURCE_LABELS: Record<SourceKey, string> = {
  greenhouse: 'Greenhouse',
  ashby: 'Ashby',
  lever: 'Lever',
};

function buildSystemPrompt(enabledSources: SourceKey[]): string {
  const sourceList = enabledSources.map((s) => `"${s}"`).join(', ');
  return `You are a job-search assistant. Generate exactly 15 realistic job postings tuned to the candidate's profile. Return ONLY a JSON array — no markdown fences, no commentary.

Each item:
{
  "id": string (unique short slug),
  "source": one of [${sourceList}],
  "company": string,
  "title": string,
  "location": string (e.g. "Remote (US)", "San Francisco, CA"),
  "compRange": string | null (e.g. "$200k-$240k base + 0.05% equity" or null),
  "description": string (4-6 sentences, plausible posting prose, sets up the role),
  "tags": string[] (3-5 tech / domain tags),
  "score": number 0-100 (how well this matches the candidate),
  "scoreReason": string (one sentence justifying the score),
  "applyUrl": string (a plausible apply-page URL — see source patterns below),
  "responsibilities": string[] (4-6 bullet points, each one short sentence describing day-to-day work),
  "requirements": string[] (4-6 bullet points, each one short sentence describing must-haves),
  "benefits": string[] (3-5 bullet points like "401k match", "Unlimited PTO", "Remote stipend"),
  "experienceYears": string | null (e.g. "5+ years", "Senior level", or null),
  "companyBlurb": string | null (1-2 sentences about the company — what they do, stage, vibe)
}

URL patterns by source:
- greenhouse: https://boards.greenhouse.io/{company-slug}/jobs/{id}
- ashby: https://jobs.ashbyhq.com/{company-slug}/{id}
- lever: https://jobs.lever.co/{company-slug}/{id}

Rules:
- Distribute postings across the enabled sources (don't put them all on one)
- Mix tiers: ~4 strong (>=80), ~6 decent (50-79), ~5 skip (<50). Skips help calibrate.
- COUNTRY: only generate jobs available in the candidate's "country" or fully remote / global. If no country given, default to US-friendly remote.
- SPONSORSHIP: if requiresSponsorship is true, include only jobs that accept sponsorship; if false, generate a normal mix.
- COMP: postings below compFloor score lower
- DEAL-BREAKERS: postings violating dealBreakers score lower
- COMPANY STAGE / SIZE: if specified, score off-stage / off-size postings lower
- EQUITY: if equityImportance is "dealbreaker", postings without equity score very low; if "irrelevant", treat equity as neutral
- INDUSTRIES TO EXCLUDE: avoid generating postings in those industries
- EMPLOYMENT TYPES: contract roles for full-time-only candidates score lower, and vice versa
- Vary companies; no duplicates
- Make responsibilities, requirements, benefits CONCRETE and specific to the role — not generic placeholders`;
}

function fallbackApplyUrl(source: SourceKey, company: string, id: string): string {
  const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  switch (source) {
    case 'greenhouse':
      return `https://boards.greenhouse.io/${slug}/jobs/${id}`;
    case 'ashby':
      return `https://jobs.ashbyhq.com/${slug}/${id}`;
    case 'lever':
      return `https://jobs.lever.co/${slug}/${id}`;
  }
}

function coerceJob(raw: unknown, enabledSources: SourceKey[]): ScoredJob | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.title !== 'string' || typeof r.company !== 'string' || typeof r.description !== 'string') {
    return null;
  }
  const sourceCandidate = typeof r.source === 'string' ? r.source : '';
  const source: SourceKey = enabledSources.includes(sourceCandidate as SourceKey)
    ? (sourceCandidate as SourceKey)
    : enabledSources[0];
  const rawScore = typeof r.score === 'number' ? r.score : 0;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  const id = r.id;
  const company = r.company;
  return {
    id,
    source,
    company,
    title: r.title,
    location: typeof r.location === 'string' ? r.location : 'Remote',
    compRange: typeof r.compRange === 'string' ? r.compRange : null,
    description: r.description,
    tags: Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === 'string').slice(0, 5) : [],
    score,
    scoreReason: typeof r.scoreReason === 'string' ? r.scoreReason : '',
    applyUrl: typeof r.applyUrl === 'string' && r.applyUrl.length > 0
      ? r.applyUrl
      : fallbackApplyUrl(source, company, id),
    responsibilities: Array.isArray(r.responsibilities)
      ? r.responsibilities.filter((s): s is string => typeof s === 'string').slice(0, 6)
      : [],
    requirements: Array.isArray(r.requirements)
      ? r.requirements.filter((s): s is string => typeof s === 'string').slice(0, 6)
      : [],
    benefits: Array.isArray(r.benefits)
      ? r.benefits.filter((s): s is string => typeof s === 'string').slice(0, 5)
      : [],
    experienceYears: typeof r.experienceYears === 'string' && r.experienceYears.length > 0 ? r.experienceYears : null,
    companyBlurb: typeof r.companyBlurb === 'string' && r.companyBlurb.length > 0 ? r.companyBlurb : null,
  };
}

export async function scanJobs(
  profile: Profile,
  enabledSources: SourceKey[],
  apiKey: string,
  model: string,
): Promise<ScoredJob[]> {
  if (enabledSources.length === 0) return [];
  const system = buildSystemPrompt(enabledSources);
  const user = JSON.stringify(profile, null, 2);

  const raw = await fetchCompletion(apiKey, model, [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Model returned invalid JSON');
  }
  if (!Array.isArray(parsed)) throw new Error('Expected an array of jobs');

  const seen = new Set<string>();
  const jobs: ScoredJob[] = [];
  for (const item of parsed) {
    const job = coerceJob(item, enabledSources);
    if (!job) continue;
    if (seen.has(job.id)) continue;
    seen.add(job.id);
    jobs.push(job);
  }
  return jobs;
}

export { SOURCE_LABELS };
