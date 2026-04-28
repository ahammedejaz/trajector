import type { ScoreTier } from '../../types';
import styles from './UseCases.module.css';

interface Persona {
  tier: ScoreTier;
  title: string;
  scenario: string;
}

const PERSONAS: Persona[] = [
  {
    tier: 'strong',
    title: 'Senior IC, mid-job-search',
    scenario:
      "I have a job. I'd take a great offer. I open Trajector once a month, scan, glance at strong matches, ignore the rest.",
  },
  {
    tier: 'decent',
    title: 'Active job seeker, picky',
    scenario:
      "I'm out. I have a list of dealBreakers. I want the LLM to filter the noise so I can spend Saturday on cover letters, not searches.",
  },
  {
    tier: 'skip',
    title: 'Career changer, exploring',
    scenario:
      "I want to test what 'senior backend' means in different stages. I run scans with different profiles and compare.",
  },
];

export function UseCases() {
  return (
    <section className={styles.root}>
      <div className={styles.inner}>
        <h2 className={styles.title}>Who it's for</h2>
        <p className={styles.subtitle}>
          Three sketches. If one of these is you, Trajector saves you Saturday.
        </p>
        <div className={styles.grid}>
          {PERSONAS.map((p) => (
            <article key={p.title} className={styles.card}>
              <span className={`${styles.avatar} ${styles[p.tier]}`} />
              <p className={styles.cardTitle}>{p.title}</p>
              <p className={styles.cardBody}>{p.scenario}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
