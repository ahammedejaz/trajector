import type { ScoreTier } from '../../types';
import styles from './FeatureGrid.module.css';

interface Feature {
  tier: ScoreTier;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    tier: 'strong',
    title: 'Triage by tier',
    body:
      'Strong, decent, skip — color-coded so you skim past the noise and see only the matches that earn your time.',
  },
  {
    tier: 'decent',
    title: 'Profile that actually matters',
    body:
      'Stack, comp floor, country, sponsorship, equity tolerance — fields that actually shift the score, not vanity inputs.',
  },
  {
    tier: 'skip',
    title: 'BYO model',
    body:
      'Use your OpenRouter key with Claude, GPT, Gemini, Llama. Switch any time, pay only for what you use.',
  },
];

export function FeatureGrid() {
  return (
    <section className={styles.root} id="features">
      <div className={styles.inner}>
        {FEATURES.map((f) => (
          <article key={f.tier} className={styles.card}>
            <span className={`${styles.accent} ${styles[f.tier]}`} />
            <h3 className={styles.title}>{f.title}</h3>
            <p className={styles.body}>{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
