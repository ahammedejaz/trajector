import { useEffect, useMemo, useState } from 'react';
import type { Profile, ScoredJob, SourceKey, SourceState, ScoreTier } from '../../types';
import { loadSettings } from '../../lib/storage';
import { scanJobs, SOURCE_LABELS } from '../../lib/scanJobs';
import { scoreTier } from '../../lib/scoreTier';
import { JobCard } from '../../components/JobCard/JobCard';
import { SourceRow } from '../../components/SourceRow/SourceRow';
import { SideSheet } from '../../components/SideSheet/SideSheet';
import { ScoreDot } from '../../components/ScoreDot/ScoreDot';
import { JobDetail } from '../../components/JobDetail/JobDetail';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { ProfileSummary } from '../../components/ProfileSummary/ProfileSummary';
import { FilterGroup } from '../../components/FilterGroup/FilterGroup';
import { Segmented } from '../../components/Segmented/Segmented';
import { RangeSlider } from '../../components/RangeSlider/RangeSlider';
import styles from './Results.module.css';

interface Props {
  profile: Profile;
  onEditProfile: () => void;
  onSwitchResume: () => void;
  onOpenSettings: () => void;
  onScanFinished?: () => void;
}

type TierFilter = 'all' | ScoreTier;

interface Filters {
  tier: TierFilter;
  sources: Set<SourceKey>;
  minScore: number;
}

const TIER_OPTS = [
  { value: 'all', label: 'All' },
  { value: 'strong', label: 'Strong' },
  { value: 'decent', label: 'Decent' },
  { value: 'skip', label: 'Skip' },
] as const;

export function Results({ profile, onEditProfile, onSwitchResume, onOpenSettings, onScanFinished }: Props) {
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

  const [filters, setFilters] = useState<Filters>(() => ({
    tier: 'all',
    sources: new Set(enabledSources),
    minScore: 0,
  }));

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
            if (i === enabledSources.length - 1) {
              setFinished(true);
              onScanFinished?.();
            }
          }, i * 200);
          timers.push(t);
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
        setSources((prev) => prev.map((s) => ({ ...s, status: 'error' })));
        setFinished(true);
        onScanFinished?.();
      }
    }

    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [profile, enabledSources, settings.openRouterKey, settings.model, onScanFinished]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const tier = scoreTier(j.score);
      if (filters.tier !== 'all' && tier !== filters.tier) return false;
      if (!filters.sources.has(j.source)) return false;
      if (j.score < filters.minScore) return false;
      return true;
    });
  }, [jobs, filters]);

  const grouped = useMemo(() => {
    const strong: ScoredJob[] = [];
    const decent: ScoredJob[] = [];
    let skipCount = 0;
    for (const j of filteredJobs) {
      const t = scoreTier(j.score);
      if (t === 'strong') strong.push(j);
      else if (t === 'decent') decent.push(j);
      else skipCount += 1;
    }
    strong.sort((a, b) => b.score - a.score);
    decent.sort((a, b) => b.score - a.score);
    return { strong, decent, skipCount };
  }, [filteredJobs]);

  const countsByKey = useMemo(() => {
    const m = new Map<SourceKey, number>();
    for (const j of jobs) m.set(j.source, (m.get(j.source) ?? 0) + 1);
    return m;
  }, [jobs]);

  function toggleSource(k: SourceKey) {
    setFilters((f) => {
      const next = new Set(f.sources);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return { ...f, sources: next };
    });
  }

  const subtitle = `${profile.targetRole} · ${profile.level} · ${profile.locationPreference}`;

  return (
    <div className={styles.root}>
      <Sidebar
        footer={
          <>
            <button type="button" className={styles.settingsLink} onClick={onOpenSettings}>
              Settings
            </button>
            <button type="button" className={styles.newScan} onClick={onSwitchResume}>
              New scan
            </button>
          </>
        }
      >
        <ProfileSummary profile={profile} onEdit={onEditProfile} />

        <FilterGroup title="Tier">
          <Segmented
            options={TIER_OPTS}
            value={filters.tier}
            onChange={(v) => setFilters((f) => ({ ...f, tier: v as TierFilter }))}
            ariaLabel="Tier filter"
          />
        </FilterGroup>

        <FilterGroup title="Sources">
          {enabledSources.map((k) => (
            <label key={k} className={styles.checkRow}>
              <input
                type="checkbox"
                aria-label={SOURCE_LABELS[k]}
                checked={filters.sources.has(k)}
                onChange={() => toggleSource(k)}
              />
              <span>{SOURCE_LABELS[k]}</span>
            </label>
          ))}
        </FilterGroup>

        <FilterGroup title="Min score">
          <RangeSlider
            min={0}
            max={100}
            value={filters.minScore}
            onChange={(v) => setFilters((f) => ({ ...f, minScore: v }))}
            ariaLabel="Min score"
          />
        </FilterGroup>
      </Sidebar>

      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>Results</h1>
          <p className={styles.subtitle}>{subtitle}</p>
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
          <p className={styles.empty}>No matches yet. Try widening your profile or relaxing filters.</p>
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
            {grouped.skipCount} skipped — refine filters or profile to surface more.
          </p>
        )}
      </main>

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
