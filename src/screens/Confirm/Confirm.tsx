import { useMemo, useState } from 'react';
import type {
  Profile,
  Level,
  LocationPref,
  EmploymentType,
  CompanyStage,
  CompanySize,
  EquityImportance,
  JobSearchStatus,
} from '../../types';
import { TagChips } from '../../components/TagChips/TagChips';
import { Segmented } from '../../components/Segmented/Segmented';
import { Toggle } from '../../components/Toggle/Toggle';
import { MultiPill } from '../../components/MultiPill/MultiPill';
import { Disclosure } from '../../components/Disclosure/Disclosure';
import { CountrySelect } from '../../components/CountrySelect/CountrySelect';
import { DotGrid } from '../../components/DotGrid/DotGrid';
import { saveProfile } from '../../lib/profileStore';
import styles from './Confirm.module.css';

const LEVEL_OPTS = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'staff', label: 'Staff' },
  { value: 'principal', label: 'Principal' },
] as const;

const LOC_OPTS = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
  { value: 'flexible', label: 'Flexible' },
] as const;

const EMPLOYMENT_OPTS = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'part-time', label: 'Part-time' },
] as const;

const STAGE_OPTS = [
  { value: 'seed', label: 'Seed' },
  { value: 'early', label: 'Early' },
  { value: 'growth', label: 'Growth' },
  { value: 'public', label: 'Public' },
] as const;

const SIZE_OPTS = [
  { value: 'startup', label: 'Startup <50' },
  { value: 'mid', label: 'Mid 50–500' },
  { value: 'large', label: 'Large 500–5k' },
  { value: 'enterprise', label: 'Enterprise 5k+' },
] as const;

const EQUITY_OPTS = [
  { value: 'dealbreaker', label: 'Dealbreaker' },
  { value: 'important', label: 'Important' },
  { value: 'nice', label: 'Nice-to-have' },
  { value: 'irrelevant', label: 'Irrelevant' },
] as const;

const STATUS_OPTS = [
  { value: 'active', label: 'Active' },
  { value: 'open', label: 'Open' },
  { value: 'passive', label: 'Passive' },
] as const;

interface Props {
  profile: Profile;
  onConfirm: (profile: Profile) => void;
  onSaveAndExit?: () => void;
}

function isInferred(p: Profile, k: keyof Profile): boolean {
  const v = p[k];
  if (v === null) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (typeof v === 'number') return true;
  if (typeof v === 'boolean') return v === true;
  if (Array.isArray(v)) return v.length > 0;
  return false;
}

interface AiPillProps {
  show: boolean;
}

function AiPill({ show }: AiPillProps) {
  if (!show) return null;
  return <span className={styles.aiPill}>AI</span>;
}

export function Confirm({ profile: initial, onConfirm, onSaveAndExit }: Props) {
  const [profile, setProfile] = useState<Profile>(initial);
  const [touched, setTouched] = useState<Set<keyof Profile>>(new Set());
  const [savedFlash, setSavedFlash] = useState(false);

  const inferredAtMount = useMemo(() => {
    const s = new Set<keyof Profile>();
    (Object.keys(initial) as Array<keyof Profile>).forEach((k) => {
      if (isInferred(initial, k)) s.add(k);
    });
    return s;
  }, [initial]);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
    setTouched((t) => {
      if (t.has(key)) return t;
      const next = new Set(t);
      next.add(key);
      return next;
    });
  }

  function ai(k: keyof Profile): boolean {
    return inferredAtMount.has(k) && !touched.has(k);
  }

  const isValid = profile.targetRole.trim().length > 0;

  function handleSaveOnly() {
    saveProfile(profile);
    setSavedFlash(true);
    setTimeout(() => {
      setSavedFlash(false);
      onSaveAndExit?.();
    }, 2000);
  }

  return (
    <div className={styles.root}>
      <DotGrid spacing={32} />
      <div className={styles.content}>
      <header className={styles.header}>
        <h1 className={styles.title}>Confirm your profile</h1>
        <p className={styles.subtitle}>
          We read this from your resume. Edit anything that's wrong before we start scanning.
        </p>
      </header>

      <div className={styles.sections}>
        <Disclosure title="Essentials" defaultOpen>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="target-role">
                Target role <AiPill show={ai('targetRole')} />
              </label>
              <input
                id="target-role"
                className={styles.input}
                value={profile.targetRole}
                onChange={(e) => update('targetRole', e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <p className={styles.label}>
                Level <AiPill show={ai('level')} />
              </p>
              <Segmented
                options={LEVEL_OPTS}
                value={profile.level}
                onChange={(v) => update('level', v as Level)}
                ariaLabel="Level"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="years-exp">
                Years of experience <AiPill show={ai('yearsOfExperience')} />
              </label>
              <input
                id="years-exp"
                className={styles.input}
                type="number"
                min={0}
                max={50}
                placeholder="7"
                value={profile.yearsOfExperience ?? ''}
                onChange={(e) =>
                  update('yearsOfExperience', e.target.value ? Number(e.target.value) : null)
                }
              />
            </div>

            <div className={styles.field}>
              <p className={styles.label}>
                Stack signals <AiPill show={ai('stackSignals')} />
              </p>
              <TagChips
                chips={profile.stackSignals}
                onAdd={(c) =>
                  !profile.stackSignals.includes(c) &&
                  update('stackSignals', [...profile.stackSignals, c])
                }
                onRemove={(c) =>
                  update('stackSignals', profile.stackSignals.filter((x) => x !== c))
                }
                placeholder="+ Add"
              />
            </div>

            <div className={styles.field}>
              <p className={styles.label}>
                Employment types <AiPill show={ai('employmentTypes')} />
              </p>
              <MultiPill
                options={EMPLOYMENT_OPTS}
                value={profile.employmentTypes}
                onChange={(v) => update('employmentTypes', v as EmploymentType[])}
                ariaLabel="Employment types"
              />
            </div>
          </div>
        </Disclosure>

        <Disclosure title="Logistics">
          <div className={styles.fields}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="comp-floor">
                  Comp floor <AiPill show={ai('compFloor')} />
                </label>
                <input
                  id="comp-floor"
                  className={styles.input}
                  type="number"
                  placeholder="200000"
                  value={profile.compFloor ?? ''}
                  onChange={(e) =>
                    update('compFloor', e.target.value ? Number(e.target.value) : null)
                  }
                />
              </div>

              <div className={styles.field}>
                <p className={styles.label}>
                  Location preference <AiPill show={ai('locationPreference')} />
                </p>
                <Segmented
                  options={LOC_OPTS}
                  value={profile.locationPreference}
                  onChange={(v) => update('locationPreference', v as LocationPref)}
                  ariaLabel="Location preference"
                />
              </div>
            </div>

            <div className={styles.field}>
              <p className={styles.label}>
                Country <AiPill show={ai('country')} />
              </p>
              <CountrySelect
                value={profile.country}
                onChange={(c) => update('country', c)}
              />
            </div>

            {profile.locationPreference !== 'remote' && (
              <div className={styles.field}>
                <p className={styles.label}>
                  Preferred locations <AiPill show={ai('preferredLocations')} />
                </p>
                <TagChips
                  chips={profile.preferredLocations}
                  onAdd={(c) =>
                    !profile.preferredLocations.includes(c) &&
                    update('preferredLocations', [...profile.preferredLocations, c])
                  }
                  onRemove={(c) =>
                    update(
                      'preferredLocations',
                      profile.preferredLocations.filter((x) => x !== c),
                    )
                  }
                  placeholder="+ Add city or region"
                />
              </div>
            )}

            <div className={styles.fieldRow}>
              <div className={styles.fieldRowLeft}>
                <p className={styles.label}>
                  Requires sponsorship <AiPill show={ai('requiresSponsorship')} />
                </p>
                <p className={styles.caption}>
                  Show jobs that explicitly accept sponsorship-needing candidates.
                </p>
              </div>
              <Toggle
                checked={profile.requiresSponsorship}
                onChange={(v) => update('requiresSponsorship', v)}
                ariaLabel="Requires sponsorship"
              />
            </div>

            <div className={styles.field}>
              <p className={styles.label}>
                Deal-breakers <AiPill show={ai('dealBreakers')} />
              </p>
              <TagChips
                chips={profile.dealBreakers}
                onAdd={(c) =>
                  !profile.dealBreakers.includes(c) &&
                  update('dealBreakers', [...profile.dealBreakers, c])
                }
                onRemove={(c) =>
                  update('dealBreakers', profile.dealBreakers.filter((x) => x !== c))
                }
                placeholder="+ Add"
              />
            </div>
          </div>
        </Disclosure>

        <Disclosure title="Preferences">
          <div className={styles.fields}>
            <div className={styles.field}>
              <p className={styles.label}>
                Company stages <AiPill show={ai('companyStages')} />
              </p>
              <MultiPill
                options={STAGE_OPTS}
                value={profile.companyStages}
                onChange={(v) => update('companyStages', v as CompanyStage[])}
                ariaLabel="Company stages"
              />
            </div>

            <div className={styles.field}>
              <p className={styles.label}>
                Company size <AiPill show={ai('companySize')} />
              </p>
              <Segmented
                options={SIZE_OPTS}
                value={profile.companySize ?? 'mid'}
                onChange={(v) => update('companySize', v as CompanySize)}
                ariaLabel="Company size"
              />
            </div>

            <div className={styles.field}>
              <p className={styles.label}>
                Equity importance <AiPill show={ai('equityImportance')} />
              </p>
              <Segmented
                options={EQUITY_OPTS}
                value={profile.equityImportance ?? 'nice'}
                onChange={(v) => update('equityImportance', v as EquityImportance)}
                ariaLabel="Equity importance"
              />
            </div>

            <div className={styles.field}>
              <p className={styles.label}>
                Industries to exclude <AiPill show={ai('industriesToExclude')} />
              </p>
              <TagChips
                chips={profile.industriesToExclude}
                onAdd={(c) =>
                  !profile.industriesToExclude.includes(c) &&
                  update('industriesToExclude', [...profile.industriesToExclude, c])
                }
                onRemove={(c) =>
                  update(
                    'industriesToExclude',
                    profile.industriesToExclude.filter((x) => x !== c),
                  )
                }
                placeholder="+ Add"
              />
            </div>

            <div className={styles.field}>
              <p className={styles.label}>
                Job search status <AiPill show={ai('jobSearchStatus')} />
              </p>
              <Segmented
                options={STATUS_OPTS}
                value={profile.jobSearchStatus ?? 'open'}
                onChange={(v) => update('jobSearchStatus', v as JobSearchStatus)}
                ariaLabel="Job search status"
              />
            </div>
          </div>
        </Disclosure>
      </div>

      <div className={styles.ctaRow}>
        <button
          type="button"
          className={styles.secondary}
          onClick={handleSaveOnly}
        >
          {savedFlash ? 'Saved ✓' : 'Save profile only'}
        </button>
        <button
          type="button"
          className={styles.primary}
          disabled={!isValid}
          onClick={() => onConfirm(profile)}
        >
          Start scanning →
        </button>
      </div>
      </div>
    </div>
  );
}
