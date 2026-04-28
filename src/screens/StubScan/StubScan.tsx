import type { Profile } from '../../types';
import styles from './StubScan.module.css';

const SOURCES = ['LinkedIn', 'Greenhouse', 'Lever', 'Workable', 'Y Combinator'];

interface Props {
  profile: Profile;
  onReset: () => void;
}

export function StubScan({ profile, onReset }: Props) {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>Scanning the open web</h1>
        <p className={styles.subtitle}>
          {profile.targetRole} · {profile.level} · {profile.location}
        </p>
      </header>

      <div className={styles.sources}>
        {SOURCES.map((src) => (
          <div key={src} className={styles.sourceRow}>
            <span className={styles.glyph}>○</span>
            <span className={styles.sourceName}>{src}</span>
            <span className={styles.status}>queued</span>
          </div>
        ))}
      </div>

      <p className={styles.stub}>Job scanning arrives in Plan 3.</p>

      <button type="button" className={styles.reset} onClick={onReset}>
        Start over
      </button>
    </div>
  );
}
