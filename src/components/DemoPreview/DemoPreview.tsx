import { useState } from 'react';
import type { ScoredJob } from '../../types';
import { DEMO_PROFILE, DEMO_JOBS } from '../../lib/demoScan';
import { JobCard } from '../JobCard/JobCard';
import { SideSheet } from '../SideSheet/SideSheet';
import { JobDetail } from '../JobDetail/JobDetail';
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
        {selected && <JobDetail job={selected} />}
      </SideSheet>
    </div>
  );
}
