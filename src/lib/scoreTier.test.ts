import { describe, it, expect } from 'vitest';
import { scoreTier } from './scoreTier';

describe('scoreTier', () => {
  it('returns "strong" for scores >= 80', () => {
    expect(scoreTier(80)).toBe('strong');
    expect(scoreTier(95)).toBe('strong');
    expect(scoreTier(100)).toBe('strong');
  });

  it('returns "decent" for scores 50-79', () => {
    expect(scoreTier(50)).toBe('decent');
    expect(scoreTier(65)).toBe('decent');
    expect(scoreTier(79)).toBe('decent');
  });

  it('returns "skip" for scores < 50', () => {
    expect(scoreTier(0)).toBe('skip');
    expect(scoreTier(25)).toBe('skip');
    expect(scoreTier(49)).toBe('skip');
  });

  it('clamps out-of-range scores', () => {
    expect(scoreTier(-10)).toBe('skip');
    expect(scoreTier(150)).toBe('strong');
  });
});
