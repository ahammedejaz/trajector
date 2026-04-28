import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.root}>
      <div className={styles.inner}>
        <p className={styles.left}>Trajector v0.1 · MIT</p>
        <p className={styles.right}>
          <a
            className={styles.link}
            href="https://github.com/ahammedejaz/trajector"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <span className={styles.divider}>·</span>
          <span>Built by Syed Ejaz Ahammed</span>
        </p>
      </div>
    </footer>
  );
}
