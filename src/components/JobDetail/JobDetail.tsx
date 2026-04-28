import type { ScoredJob, SourceKey } from '../../types';
import { ScoreDot } from '../ScoreDot/ScoreDot';
import { scoreTier } from '../../lib/scoreTier';
import styles from './JobDetail.module.css';

const SOURCE_NAMES: Record<SourceKey, string> = {
  linkedin: 'LinkedIn',
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  workable: 'Workable',
  yc: 'Y Combinator',
};

interface Props {
  job: ScoredJob;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

export function JobDetail({ job }: Props) {
  const meta = [job.company, job.location, job.compRange].filter(Boolean).join(' · ');
  const tier = scoreTier(job.score);
  const sourceName = SOURCE_NAMES[job.source];

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <p className={styles.meta}>{meta}</p>
        {job.experienceYears && (
          <p className={styles.exp}>
            <span className={styles.expDot} />
            {job.experienceYears}
          </p>
        )}
      </div>

      {job.tags.length > 0 && (
        <div className={styles.tags}>
          {job.tags.map((t) => (
            <span key={t} className={styles.tag}>{t}</span>
          ))}
        </div>
      )}

      <Section title="About the role">
        <p className={styles.body}>{job.description}</p>
      </Section>

      {job.responsibilities.length > 0 && (
        <Section title="Responsibilities">
          <ul className={styles.list}>
            {job.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </Section>
      )}

      {job.requirements.length > 0 && (
        <Section title="Requirements">
          <ul className={styles.list}>
            {job.requirements.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </Section>
      )}

      {job.benefits.length > 0 && (
        <Section title="Benefits">
          <ul className={styles.list}>
            {job.benefits.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        </Section>
      )}

      {job.companyBlurb && (
        <Section title="About the company">
          <p className={styles.body}>{job.companyBlurb}</p>
        </Section>
      )}

      <Section title="Why this score">
        <p className={styles.scoreLine}>
          <ScoreDot tier={tier} ariaLabel={`Score ${job.score}`} />
          <span className={styles.scoreNum}>{job.score}</span>
          <span className={styles.scoreReason}>{job.scoreReason}</span>
        </p>
      </Section>

      <div className={styles.applyRow}>
        <a
          className={styles.apply}
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Apply on {sourceName} →
        </a>
        <p className={styles.applyHint}>
          Opens the original posting in a new tab.
        </p>
      </div>
    </div>
  );
}
