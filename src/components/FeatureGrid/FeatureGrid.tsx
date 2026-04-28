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
  {
    tier: 'strong',
    title: 'Country-aware scoring',
    body:
      'Only see jobs you can actually take, in your country or fully remote. The LLM filters for you.',
  },
  {
    tier: 'decent',
    title: 'Sponsorship-respectful',
    body:
      'Mark sponsorship needs once. Postings that explicitly exclude you score lower automatically.',
  },
  {
    tier: 'skip',
    title: 'Open-source, MIT',
    body:
      'Read the code, fork it, run it locally. No black box, no lock-in, no telemetry.',
  },
];

export function FeatureGrid() {
  return (
    <section className={styles.root} id="features">
      <div className={styles.inner}>
        {FEATURES.map((f, i) => (
          <article key={`${f.tier}-${i}`} className={styles.card}>
            <span className={`${styles.icon} ${styles[f.tier]}`} aria-hidden="true" />
            <h3 className={styles.title}>{f.title}</h3>
            <p className={styles.body}>{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
