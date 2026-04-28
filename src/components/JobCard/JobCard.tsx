import type { ScoredJob } from '../../types';
import { ScoreDot } from '../ScoreDot/ScoreDot';
import { scoreTier } from '../../lib/scoreTier';
import styles from './JobCard.module.css';

interface Props {
  job: ScoredJob;
  onClick: (job: ScoredJob) => void;
}

export function JobCard({ job, onClick }: Props) {
  const tier = scoreTier(job.score);
  const meta = [job.company, job.location, job.compRange].filter(Boolean).join(' · ');
  return (
    <button
      type="button"
      className={styles.root}
      onClick={() => onClick(job)}
      aria-label={`${job.title} at ${job.company}`}
    >
      <ScoreDot tier={tier} />
      <div className={styles.body}>
        <p className={styles.title}>{job.title}</p>
        <p className={styles.meta}>{meta}</p>
        {job.tags.length > 0 && (
          <div className={styles.tags}>
            {job.tags.map((t) => (
              <span key={t} className={styles.tag}>{t}</span>
            ))}
          </div>
        )}
      </div>
      <span className={styles.score}>{job.score}</span>
    </button>
  );
}
