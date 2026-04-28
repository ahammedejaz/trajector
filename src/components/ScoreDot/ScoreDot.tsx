import type { ScoreTier } from '../../types';
import styles from './ScoreDot.module.css';

interface Props {
  tier: ScoreTier;
  ariaLabel?: string;
}

export function ScoreDot({ tier, ariaLabel }: Props) {
  return (
    <span
      className={`${styles.dot} ${styles[tier]}`}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    />
  );
}
