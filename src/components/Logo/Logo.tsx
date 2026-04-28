import styles from './Logo.module.css';

interface Props {
  size?: 'sm' | 'md';
}

export function Logo({ size = 'md' }: Props) {
  return (
    <span className={`${styles.root} ${styles[size]}`}>
      <span className={styles.mark} aria-hidden="true">
        <span className={styles.dot} />
      </span>
      <span className={styles.wordmark}>Trajector</span>
    </span>
  );
}
