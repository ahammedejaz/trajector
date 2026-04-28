import styles from './FaqAccordion.module.css';

const FAQS = [
  {
    q: 'Where does my data go?',
    a: 'Nowhere. Resume parsing, LLM calls, and storage all happen in your browser.',
  },
  {
    q: 'Why do I need an OpenRouter key?',
    a: 'Trajector calls an LLM to score jobs. OpenRouter is a multi-model gateway — bring your own key, you control the spend.',
  },
  {
    q: 'Are these real job postings?',
    a: 'v0 synthesizes plausible postings from your profile to demo the scoring system end-to-end. Real-source ingestion is on the roadmap.',
  },
  {
    q: 'What does it cost?',
    a: 'Free. You pay OpenRouter directly for whatever model you pick. Sonnet 4.6 is roughly $0.01 per scan.',
  },
  {
    q: 'Open source?',
    a: 'MIT-licensed. Star the repo on GitHub: github.com/ahammedejaz/trajector',
  },
];

export function FaqAccordion() {
  return (
    <section className={styles.root} id="faq">
      <div className={styles.inner}>
        <h2 className={styles.title}>FAQ</h2>
        <div className={styles.list}>
          {FAQS.map((item) => (
            <details key={item.q} role="group" className={styles.item}>
              <summary className={styles.summary}>{item.q}</summary>
              <p className={styles.answer}>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
