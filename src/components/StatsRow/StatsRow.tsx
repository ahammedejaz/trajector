import styles from './StatsRow.module.css';

interface Stat {
  value: string;
  label: string;
}

const STATS: Stat[] = [
  { value: '15', label: 'jobs scored per scan' },
  { value: '~$0.01', label: 'cost per scan with Sonnet' },
  { value: '8s', label: 'average scan time' },
  { value: '0', label: 'servers, accounts, or data shared' },
];

export function StatsRow() {
  return (
    <section className={styles.root}>
      <div className={styles.inner}>
        {STATS.map((s, i) => (
          <div key={i} className={styles.cell}>
            <p className={styles.value}>{s.value}</p>
            <p className={styles.label}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
