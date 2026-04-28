import type { ResumeText } from '../../types';
import styles from './StubResult.module.css';

interface StubResultProps {
  resume: ResumeText;
  onReset: () => void;
}

export function StubResult({ resume, onReset }: StubResultProps) {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.wordmark}>Trajector</span>
        <button type="button" className={styles['reset-button']} onClick={onReset}>
          Try another resume
        </button>
      </div>
      <h2 className={styles.title}>Extracted text (Plan 1 stub)</h2>
      <p className={styles.meta}>
        {resume.filename} · {resume.kind.toUpperCase()} · {resume.byteSize.toLocaleString()} bytes
      </p>
      <p className={styles.warning}>
        This screen is temporary. Plan 2 replaces it with the real profile-confirmation step.
      </p>
      <pre className={styles.preview}>{resume.text}</pre>
    </div>
  );
}
