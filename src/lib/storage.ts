import type { AppSettings } from '../types';

const KEY = 'trajector_settings';
const DEFAULTS: AppSettings = {
  openRouterKey: '',
  model: 'anthropic/claude-sonnet-4-6',
  sources: { greenhouse: true, ashby: true, lever: true },
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS, sources: { ...DEFAULTS.sources } };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ...DEFAULTS, ...parsed, sources: { ...DEFAULTS.sources, ...parsed.sources } };
  } catch {
    return { ...DEFAULTS, sources: { ...DEFAULTS.sources } };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings));
}
