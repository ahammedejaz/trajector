import type { ReactNode } from 'react';
import styles from './Hero.module.css';

interface Props {
  rightSlot: ReactNode;
  onPrimaryClick: () => void;
  onSecondaryClick: () => void;
}

export function Hero({ rightSlot, onPrimaryClick, onSecondaryClick }: Props) {
  return (
    <section className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <p className={styles.eyebrow}>Open-source, local-first</p>
          <h1 className={styles.headline}>Find the few jobs worth your time.</h1>
          <p className={styles.sub}>
            Drop your resume. We'll synthesize a candidate profile, score live postings against it, and
            rank what's actually a fit. Your resume and your API key never leave your browser.
          </p>
          <div className={styles.ctas}>
            <button type="button" className={styles.primary} onClick={onPrimaryClick}>
              Drop your resume
            </button>
            <button type="button" className={styles.secondary} onClick={onSecondaryClick}>
              See an example scan
            </button>
          </div>
        </div>
        <div className={styles.right}>{rightSlot}</div>
      </div>
    </section>
  );
}
