import { useEffect, useMemo, useState } from 'react';
import type { Profile, ScoredJob, SourceKey, SourceState } from '../../types';
import { loadSettings } from '../../lib/storage';
import { scanJobs, SOURCE_LABELS } from '../../lib/scanJobs';
import { scoreTier } from '../../lib/scoreTier';
import { JobCard } from '../../components/JobCard/JobCard';
import { SourceRow } from '../../components/SourceRow/SourceRow';
import { SideSheet } from '../../components/SideSheet/SideSheet';
import { ProfileMenu } from '../../components/ProfileMenu/ProfileMenu';
import { ScoreDot } from '../../components/ScoreDot/ScoreDot';
import styles from './Results.module.css';

interface Props {
  profile: Profile;
  onEditProfile: () => void;
  onSwitchResume: () => void;
  onOpenSettings: () => void;
}

export function Results({ profile, onEditProfile, onSwitchResume, onOpenSettings }: Props) {
  const settings = useMemo(() => loadSettings(), []);
  const enabledSources = useMemo<SourceKey[]>(
    () => (Object.keys(settings.sources) as SourceKey[]).filter((k) => settings.sources[k]),
    [settings],
  );

  const [sources, setSources] = useState<SourceState[]>(() =>
    enabledSources.map((k) => ({ key: k, label: SOURCE_LABELS[k], status: 'scanning' })),
  );
  const [jobs, setJobs] = useState<ScoredJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [selected, setSelected] = useState<ScoredJob | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    async function run() {
      try {
        const results = await scanJobs(profile, enabledSources, settings.openRouterKey, settings.model);
        if (cancelled) return;
        setJobs(results);
        enabledSources.forEach((key, i) => {
          const t = setTimeout(() => {
            if (cancelled) return;
            setSources((prev) =>
              prev.map((s) => (s.key === key ? { ...s, status: 'done' } : s)),
            );
            if (i === enabledSources.length - 1) setFinished(true);
          }, i * 200);
          timers.push(t);
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
        setSources((prev) => prev.map((s) => ({ ...s, status: 'error' })));
        setFinished(true);
      }
    }

    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [profile, enabledSources, settings.openRouterKey, settings.model]);

  const grouped = useMemo(() => {
    const strong: ScoredJob[] = [];
    const decent: ScoredJob[] = [];
    let skipCount = 0;
    for (const j of jobs) {
      const t = scoreTier(j.score);
      if (t === 'strong') strong.push(j);
      else if (t === 'decent') decent.push(j);
      else skipCount += 1;
    }
    strong.sort((a, b) => b.score - a.score);
    decent.sort((a, b) => b.score - a.score);
    return { strong, decent, skipCount };
  }, [jobs]);

  const countsByKey = useMemo(() => {
    const m = new Map<SourceKey, number>();
    for (const j of jobs) m.set(j.source, (m.get(j.source) ?? 0) + 1);
    return m;
  }, [jobs]);

  const subtitle = `${profile.targetRole} · ${profile.level} · ${profile.location}`;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Results</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <ProfileMenu
          onEditProfile={onEditProfile}
          onSwitchResume={onSwitchResume}
          onOpenSettings={onOpenSettings}
        />
      </header>

      <section className={styles.scanPanel}>
        {sources.map((s) => (
          <SourceRow
            key={s.key}
            label={s.label}
            status={s.status}
            count={s.status === 'done' ? countsByKey.get(s.key) ?? 0 : undefined}
          />
        ))}
      </section>

      {error && (
        <div className={styles.errorBox}>
          <p className={styles.errorTitle}>Scan failed</p>
          <p className={styles.errorMsg}>{error}</p>
        </div>
      )}

      {finished && !error && grouped.strong.length === 0 && grouped.decent.length === 0 && (
        <p className={styles.empty}>No matches yet. Try widening your profile.</p>
      )}

      {grouped.strong.length > 0 && (
        <section className={styles.group}>
          <h2 className={styles.groupTitle}>
            <ScoreDot tier="strong" /> Strong matches ({grouped.strong.length})
          </h2>
          <div className={styles.list}>
            {grouped.strong.map((j) => (
              <JobCard key={j.id} job={j} onClick={setSelected} />
            ))}
          </div>
        </section>
      )}

      {grouped.decent.length > 0 && (
        <section className={styles.group}>
          <h2 className={styles.groupTitle}>
            <ScoreDot tier="decent" /> Decent matches ({grouped.decent.length})
          </h2>
          <div className={styles.list}>
            {grouped.decent.map((j) => (
              <JobCard key={j.id} job={j} onClick={setSelected} />
            ))}
          </div>
        </section>
      )}

      {grouped.skipCount > 0 && (
        <p className={styles.skipNote}>
          {grouped.skipCount} skipped — refine your profile to surface more.
        </p>
      )}

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
            <div className={styles.sheetTags}>
              {selected.tags.map((t) => (
                <span key={t} className={styles.sheetTag}>{t}</span>
              ))}
            </div>
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
