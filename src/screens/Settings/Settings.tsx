import { useState } from 'react';
import { loadSettings, saveSettings } from '../../lib/storage';
import type { AppSettings } from '../../types';
import styles from './Settings.module.css';

const CURATED_MODELS = [
  'anthropic/claude-sonnet-4-6',
  'anthropic/claude-haiku-4-5-20251001',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'google/gemini-2.0-flash-001',
  'meta-llama/llama-4-maverick',
] as const;

const SOURCE_LABELS: Record<keyof AppSettings['sources'], string> = {
  linkedin: 'LinkedIn',
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  workable: 'Workable',
  yc: 'Y Combinator',
};

interface Props {
  onDone: () => void;
}

export function Settings({ onDone }: Props) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [showKey, setShowKey] = useState(false);

  function update(patch: Partial<AppSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  }

  function toggleSource(name: keyof AppSettings['sources']) {
    update({ sources: { ...settings.sources, [name]: !settings.sources[name] } });
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <button type="button" className={styles.done} onClick={onDone}>
          Done
        </button>
      </header>

      <section className={styles.section}>
        <label className={styles.label} htmlFor="api-key">
          OpenRouter API key
        </label>
        <div className={styles.keyRow}>
          <input
            id="api-key"
            className={styles.input}
            type={showKey ? 'text' : 'password'}
            value={settings.openRouterKey}
            onChange={(e) => update({ openRouterKey: e.target.value })}
            placeholder="sk-or-v1-..."
            autoComplete="off"
          />
          <button
            type="button"
            className={styles.showToggle}
            onClick={() => setShowKey((v) => !v)}
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className={styles.hint}>Stored locally in your browser. Never sent to Trajector servers.</p>
      </section>

      <section className={styles.section}>
        <label className={styles.label} htmlFor="model-select">
          Model
        </label>
        <select
          id="model-select"
          className={styles.select}
          value={settings.model}
          onChange={(e) => update({ model: e.target.value })}
        >
          {CURATED_MODELS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <p className={styles.hint}>Used for resume parsing and job scoring. Sonnet 4.6 is the recommended default.</p>
      </section>

      <section className={styles.section}>
        <p className={styles.label}>Sources</p>
        {(Object.keys(settings.sources) as Array<keyof AppSettings['sources']>).map((src) => (
          <label key={src} className={styles.sourceRow}>
            <input
              type="checkbox"
              checked={settings.sources[src]}
              onChange={() => toggleSource(src)}
              aria-label={SOURCE_LABELS[src]}
            />
            <span>{SOURCE_LABELS[src]}</span>
          </label>
        ))}
      </section>
    </div>
  );
}
