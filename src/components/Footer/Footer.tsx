import { Logo } from '../Logo/Logo';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.brandCol}>
          <Logo size="sm" />
          <p className={styles.tagline}>Find the few jobs worth your time.</p>
        </div>
        <div className={styles.col}>
          <p className={styles.colTitle}>Product</p>
          <ul className={styles.list}>
            <li><a href="#how" className={styles.link}>How it works</a></li>
            <li><a href="#features" className={styles.link}>Features</a></li>
            <li><a href="#faq" className={styles.link}>FAQ</a></li>
          </ul>
        </div>
        <div className={styles.col}>
          <p className={styles.colTitle}>Code</p>
          <ul className={styles.list}>
            <li>
              <a className={styles.link} href="https://github.com/ahammedejaz/trajector" target="_blank" rel="noreferrer">
                GitHub
              </a>
            </li>
            <li>
              <a className={styles.link} href="https://github.com/ahammedejaz/trajector/issues" target="_blank" rel="noreferrer">
                Issues
              </a>
            </li>
            <li>
              <a className={styles.link} href="https://github.com/ahammedejaz/trajector/blob/main/LICENSE" target="_blank" rel="noreferrer">
                MIT License
              </a>
            </li>
          </ul>
        </div>
        <div className={styles.col}>
          <p className={styles.colTitle}>About</p>
          <ul className={styles.list}>
            <li><span className={styles.muted}>Built by Syed Ejaz Ahammed</span></li>
            <li><span className={styles.muted}>v0.1 · 2026</span></li>
          </ul>
        </div>
      </div>
      <div className={styles.bottom}>
        <p className={styles.copy}>Trajector v0.1 · MIT License</p>
        <p className={styles.muted}>No accounts. No telemetry. Bring your own key.</p>
      </div>
    </footer>
  );
}
