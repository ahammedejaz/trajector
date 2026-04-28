import { describe, it, expect, beforeEach } from 'vitest';
import { loadSettings, saveSettings } from './storage';
import type { AppSettings } from '../types';

beforeEach(() => { localStorage.clear(); });

describe('loadSettings', () => {
  it('returns default settings when localStorage is empty', () => {
    const s = loadSettings();
    expect(s.openRouterKey).toBe('');
    expect(s.model).toBe('anthropic/claude-sonnet-4-6');
    expect(s.sources.greenhouse).toBe(true);
    expect(s.sources.ashby).toBe(true);
  });
  it('returns stored settings when present', () => {
    const stored: AppSettings = {
      openRouterKey: 'sk-or-test', model: 'openai/gpt-4o',
      sources: { greenhouse: false, ashby: true, lever: true },
    };
    localStorage.setItem('trajector_settings', JSON.stringify(stored));
    const s = loadSettings();
    expect(s.openRouterKey).toBe('sk-or-test');
    expect(s.sources.greenhouse).toBe(false);
  });
  it('returns defaults when stored JSON is corrupt', () => {
    localStorage.setItem('trajector_settings', 'not-json{{{');
    expect(loadSettings().openRouterKey).toBe('');
  });
});

describe('saveSettings', () => {
  it('persists settings to localStorage', () => {
    saveSettings({ ...loadSettings(), openRouterKey: 'sk-or-persisted' });
    const raw = localStorage.getItem('trajector_settings');
    expect(JSON.parse(raw!).openRouterKey).toBe('sk-or-persisted');
  });
});
