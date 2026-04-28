import styles from './LocalFirstDiagram.module.css';

const BROWSER_BULLETS = ['Resume parsing', 'Profile extraction', 'Job scoring', 'UI rendering'];
const OR_BULLETS = ['Anthropic models', 'OpenAI models', 'Gemini, Llama, …'];

export function LocalFirstDiagram() {
  return (
    <section className={styles.root}>
      <div className={styles.inner}>
        <h2 className={styles.title}>Local-first by design</h2>
        <p className={styles.subtitle}>
          Your resume and your OpenRouter key never leave your browser. Trajector itself runs no servers.
        </p>
        <div className={styles.diagram}>
          <div className={styles.node}>
            <p className={styles.nodeTitle}>Your browser</p>
            <ul className={styles.bullets}>
              {BROWSER_BULLETS.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
          <div className={styles.connector} aria-hidden="true">
            <span className={styles.line} />
            <span className={styles.connectorLabel}>HTTPS</span>
            <span className={styles.line} />
          </div>
          <div className={styles.node}>
            <p className={styles.nodeTitle}>OpenRouter (your key)</p>
            <ul className={styles.bullets}>
              {OR_BULLETS.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className={styles.caption}>No Trajector servers. Ever.</p>
      </div>
    </section>
  );
}
