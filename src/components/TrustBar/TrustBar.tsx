import styles from './TrustBar.module.css';

export function TrustBar() {
  return (
    <div className={styles.root}>
      <p className={styles.text}>
        🔒 Your resume and your OpenRouter key never leave your browser. No accounts, no servers,
        no telemetry.
      </p>
    </div>
  );
}
