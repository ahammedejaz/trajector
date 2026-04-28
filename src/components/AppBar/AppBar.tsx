import styles from './AppBar.module.css';

interface Props {
  showCta: boolean;
  onBrandClick?: () => void;
}

export function AppBar({ showCta, onBrandClick }: Props) {
  return (
    <header className={styles.root}>
      <div className={styles.inner}>
        <button
          type="button"
          className={styles.brand}
          aria-label="Trajector home"
          onClick={onBrandClick}
        >
          Trajector
        </button>
        <nav className={styles.nav}>
          <a className={styles.link} href="#features">Product</a>
          <a className={styles.link} href="#how">How it works</a>
          <a className={styles.link} href="#faq">FAQ</a>
          <a
            className={styles.link}
            href="https://github.com/ahammedejaz/trajector"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
        {showCta && (
          <a className={styles.cta} href="#drop">Drop your resume</a>
        )}
      </div>
    </header>
  );
}
