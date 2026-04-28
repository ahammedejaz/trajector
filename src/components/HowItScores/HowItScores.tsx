import styles from './HowItScores.module.css';

interface Factor {
  label: string;
  weight: number;
  caption: string;
}

const FACTORS: Factor[] = [
  { label: 'Stack alignment', weight: 0.85, caption: 'How well your stack signals match the posting' },
  { label: 'Comp ≥ floor', weight: 0.7, caption: 'Salary meets or exceeds your floor' },
  { label: 'Location / country fit', weight: 0.5, caption: 'Posting available where you can work' },
  { label: 'Stage / size / equity', weight: 0.3, caption: 'Startup stage, headcount, and equity profile match preferences' },
];

export function HowItScores() {
  return (
    <section className={styles.root}>
      <div className={styles.inner}>
        <h2 className={styles.title}>How it scores</h2>
        <p className={styles.subtitle}>
          Every job gets a 0–100 score from your profile against four weighted factors.
        </p>
        <div className={styles.list}>
          {FACTORS.map((f) => (
            <div key={f.label} className={styles.row}>
              <div className={styles.head}>
                <span className={styles.dot} />
                <span className={styles.label}>{f.label}</span>
              </div>
              <div className={styles.bar}>
                <div className={styles.fill} style={{ width: `${f.weight * 100}%` }} />
              </div>
              <p className={styles.caption}>{f.caption}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
