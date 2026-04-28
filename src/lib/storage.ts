import type { AppSettings } from '../types';

const KEY = 'trajector_settings';
const DEFAULTS: AppSettings = {
  openRouterKey: '',
  model: 'anthropic/claude-sonnet-4-6',
  sources: { greenhouse: true, ashby: true, lever: true },
};

const VALID_SOURCE_KEYS = Object.keys(DEFAULTS.sources) as Array<
  keyof AppSettings['sources']
>;

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS, sources: { ...DEFAULTS.sources } };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    // Whitelist source keys against DEFAULTS so legacy values from older app
    // versions (e.g. linkedin/workable/yc) get dropped on load instead of
    // bleeding into the UI as ghost source rows.
    const sources: AppSettings['sources'] = { ...DEFAULTS.sources };
    const incoming = (parsed.sources ?? {}) as Record<string, unknown>;
    for (const k of VALID_SOURCE_KEYS) {
      const v = incoming[k];
      if (typeof v === 'boolean') sources[k] = v;
    }
    return {
      openRouterKey:
        typeof parsed.openRouterKey === 'string' ? parsed.openRouterKey : DEFAULTS.openRouterKey,
      model: typeof parsed.model === 'string' ? parsed.model : DEFAULTS.model,
      sources,
    };
  } catch {
    return { ...DEFAULTS, sources: { ...DEFAULTS.sources } };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings));
}
