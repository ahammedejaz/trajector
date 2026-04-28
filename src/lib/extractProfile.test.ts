import { describe, it, expect, vi } from 'vitest';
import { extractProfile } from './extractProfile';
import * as openrouter from './openrouter';

vi.mock('./openrouter');

function mockLLM(json: unknown) {
  vi.mocked(openrouter.fetchCompletion).mockResolvedValueOnce(JSON.stringify(json));
}

describe('extractProfile', () => {
  it('parses a complete valid JSON response', async () => {
    mockLLM({ targetRole: 'Senior Backend Engineer', level: 'senior', compFloor: 200000, location: 'remote', stackSignals: ['Go', 'PostgreSQL', 'Kubernetes'], dealBreakers: ['crypto'] });
    const p = await extractProfile('resume text', 'key', 'model');
    expect(p.targetRole).toBe('Senior Backend Engineer');
    expect(p.level).toBe('senior');
    expect(p.compFloor).toBe(200000);
    expect(p.locationPreference).toBe('remote');
    expect(p.stackSignals).toEqual(['Go', 'PostgreSQL', 'Kubernetes']);
    expect(p.dealBreakers).toEqual(['crypto']);
  });

  it('coerces an unknown level to "senior"', async () => {
    mockLLM({ targetRole: 'Eng', level: 'lead', compFloor: null, location: 'remote', stackSignals: [], dealBreakers: [] });
    expect((await extractProfile('text', 'key', 'model')).level).toBe('senior');
  });

  it('coerces an unknown location to "remote"', async () => {
    mockLLM({ targetRole: 'Eng', level: 'senior', compFloor: null, location: 'new york', stackSignals: [], dealBreakers: [] });
    expect((await extractProfile('text', 'key', 'model')).locationPreference).toBe('remote');
  });

  it('caps stackSignals at 8 items', async () => {
    mockLLM({ targetRole: 'Eng', level: 'senior', compFloor: null, location: 'remote', stackSignals: ['a','b','c','d','e','f','g','h','i','j'], dealBreakers: [] });
    expect((await extractProfile('text', 'key', 'model')).stackSignals).toHaveLength(8);
  });

  it('handles null compFloor', async () => {
    mockLLM({ targetRole: 'Eng', level: 'mid', compFloor: null, location: 'hybrid', stackSignals: [], dealBreakers: [] });
    expect((await extractProfile('text', 'key', 'model')).compFloor).toBeNull();
  });

  it('throws on invalid JSON from LLM', async () => {
    vi.mocked(openrouter.fetchCompletion).mockResolvedValueOnce('not json at all {{');
    await expect(extractProfile('text', 'key', 'model')).rejects.toThrow('invalid JSON');
  });
});
