import { useState } from 'react';
import type { ScoredJob } from '../../types';
import { DEMO_PROFILE, DEMO_JOBS } from '../../lib/demoScan';
import { JobCard } from '../JobCard/JobCard';
import { SideSheet } from '../SideSheet/SideSheet';
import { ScoreDot } from '../ScoreDot/ScoreDot';
import { scoreTier } from '../../lib/scoreTier';
import styles from './DemoPreview.module.css';

const TOP_3 = DEMO_JOBS.slice(0, 3);

export function DemoPreview() {
  const [selected, setSelected] = useState<ScoredJob | null>(null);
  return (
    <div className={styles.root} aria-label="Example scan preview">
      <div className={styles.header}>
        <p className={styles.eyebrow}>Live preview</p>
        <p className={styles.profile}>
          {DEMO_PROFILE.targetRole} · {DEMO_PROFILE.level} · {DEMO_PROFILE.country}
        </p>
      </div>
      <div className={styles.list}>
        {TOP_3.map((j) => (
          <JobCard key={j.id} job={j} onClick={setSelected} />
        ))}
      </div>
      <p className={styles.more}>+ 12 more matches</p>
      <SideSheet
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ''}
      >
        {selected && (
          <div className={styles.sheet}>
            <p className={styles.sheetMeta}>
              {selected.company} · {selected.location}
              {selected.compRange ? ` · ${selected.compRange}` : ''}
            </p>
            <p className={styles.sheetSection}>Description</p>
            <p className={styles.sheetBody}>{selected.description}</p>
            <p className={styles.sheetSection}>Why this score</p>
            <p className={styles.sheetBody}>
              <ScoreDot tier={scoreTier(selected.score)} ariaLabel={`Score ${selected.score}`} />
              <span className={styles.sheetScore}>{selected.score}</span>
              {selected.scoreReason}
            </p>
          </div>
        )}
      </SideSheet>
    </div>
  );
}
