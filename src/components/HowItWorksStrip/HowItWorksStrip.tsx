import styles from './HowItWorksStrip.module.css';

const STEPS = [
  { n: 1, title: 'Drop your resume', body: 'PDF, DOCX, or Markdown — parsed locally.' },
  { n: 2, title: 'Confirm your profile', body: 'Edit anything the LLM got wrong.' },
  { n: 3, title: 'Scan enabled sources', body: 'One LLM call, scored matches per source.' },
  { n: 4, title: 'Triage matches', body: 'Strong, decent, skip — open what earns your time.' },
];

export function HowItWorksStrip() {
  return (
    <section className={styles.root} id="how">
      <div className={styles.inner}>
        {STEPS.map((s) => (
          <div key={s.n} className={styles.step}>
            <span className={styles.num}>{s.n}</span>
            <p className={styles.title}>{s.title}</p>
            <p className={styles.body}>{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
