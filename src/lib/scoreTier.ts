import type { ScoreTier } from '../types';

export function scoreTier(score: number): ScoreTier {
  if (score >= 80) return 'strong';
  if (score >= 50) return 'decent';
  return 'skip';
}
