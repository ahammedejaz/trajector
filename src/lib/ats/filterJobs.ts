import type { RawJob } from './types';
import type { Profile } from '../../types';

const SENIOR_LEVELS = new Set(['senior', 'staff', 'principal']);
const JUNIOR_TOKENS = ['intern', 'internship', 'apprentice', 'graduate', 'entry-level', 'entry level'];
const EXEC_TOKENS = [' vp ', 'vp,', 'vp of', 'chief ', 'cto', 'cfo', 'ceo', 'head of', 'director'];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((t) => t.length >= 2);
}

/**
 * Heuristic title match score for a job vs a profile. Higher = better candidate
 * for LLM scoring. Scores can be negative (likely mismatch). The aggregator
 * filters out anything <= 0.
 */
export function jobMatchScore(job: RawJob, profile: Profile): number {
  const title = job.title.toLowerCase();
  if (!title) return -100;

  const targetTokens = tokenize(profile.targetRole);
  const stackTokens = profile.stackSignals.map((s) => s.toLowerCase());

  let score = 0;

  // +3 per targetRole token in title
  for (const t of targetTokens) {
    if (title.includes(t)) score += 3;
  }

  // +2 per stack signal in title
  for (const s of stackTokens) {
    if (s && title.includes(s)) score += 2;
  }

  // Seniority alignment
  const isSenior = SENIOR_LEVELS.has(profile.level);
  for (const j of JUNIOR_TOKENS) {
    if (title.includes(j)) {
      score -= isSenior ? 8 : 0;
    }
  }
  for (const e of EXEC_TOKENS) {
    if (title.includes(e)) {
      score -= profile.level === 'principal' ? 0 : 6;
    }
  }

  // Penalize obvious non-matches: 'recruiter', 'sales', 'marketing' for engineering profiles
  const role = profile.targetRole.toLowerCase();
  const isEngineering = role.includes('engineer') || role.includes('developer') || role.includes('architect');
  if (isEngineering) {
    if (/\b(recruiter|sales|marketing|account executive|customer success)\b/.test(title)) {
      score -= 5;
    }
  }

  return score;
}

/**
 * Score every job against the profile, drop non-matches (score <= 0),
 * sort by descending score, and return the top N candidates ready for LLM scoring.
 */
export function filterJobsByProfile(jobs: RawJob[], profile: Profile, topN: number): RawJob[] {
  const scored = jobs
    .map((j) => ({ job: j, score: jobMatchScore(j, profile) }))
    .filter((x) => x.score > 0);
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN).map((x) => x.job);
}
