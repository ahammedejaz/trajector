import { useState } from 'react';
import type { Profile } from '../../types';
import { TagChips } from '../../components/TagChips/TagChips';
import styles from './Confirm.module.css';

const LEVELS = ['junior', 'mid', 'senior', 'staff', 'principal'] as const;
const LOCATIONS = ['remote', 'hybrid', 'onsite', 'flexible'] as const;

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface Props {
  profile: Profile;
  onConfirm: (profile: Profile) => void;
}

export function Confirm({ profile: initial, onConfirm }: Props) {
  const [profile, setProfile] = useState<Profile>(initial);
  const [roleTouched, setRoleTouched] = useState(false);

  function update(patch: Partial<Profile>) {
    setProfile((p) => ({ ...p, ...patch }));
  }

  const roleError = roleTouched && !profile.targetRole.trim() ? 'Required.' : null;
  const isValid = Boolean(profile.targetRole.trim() && profile.level && profile.locationPreference);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>Confirm your profile</h1>
        <p className={styles.subtitle}>
          We read this from your resume. Edit anything that's wrong before we start scanning.
        </p>
      </header>

      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="target-role">
            Target role
          </label>
          <input
            id="target-role"
            className={`${styles.input}${roleError ? ` ${styles.inputError}` : ''}`}
            value={profile.targetRole}
            onChange={(e) => update({ targetRole: e.target.value })}
            onBlur={() => setRoleTouched(true)}
          />
          {roleError && <p className={styles.errorMsg}>{roleError}</p>}
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="level">Level</label>
            <select
              id="level"
              className={styles.select}
              value={profile.level}
              onChange={(e) => update({ level: e.target.value as Profile['level'] })}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>{capitalize(l)}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="comp-floor">Comp floor</label>
            <input
              id="comp-floor"
              className={styles.input}
              type="number"
              placeholder="200000"
              value={profile.compFloor ?? ''}
              onChange={(e) =>
                update({ compFloor: e.target.value ? Number(e.target.value) : null })
              }
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="location">Location</label>
            <select
              id="location"
              className={styles.select}
              value={profile.locationPreference}
              onChange={(e) => update({ locationPreference: e.target.value as Profile['locationPreference'] })}
            >
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>{capitalize(l)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <p className={styles.label}>Stack signals</p>
          <TagChips
            chips={profile.stackSignals}
            onRemove={(chip) => update({ stackSignals: profile.stackSignals.filter((s) => s !== chip) })}
            onAdd={(chip) => {
              if (!profile.stackSignals.includes(chip)) {
                update({ stackSignals: [...profile.stackSignals, chip] });
              }
            }}
            placeholder="+ Add"
          />
        </div>

        <div className={styles.field}>
          <p className={styles.label}>Deal-breakers</p>
          <TagChips
            chips={profile.dealBreakers}
            onRemove={(chip) => update({ dealBreakers: profile.dealBreakers.filter((s) => s !== chip) })}
            onAdd={(chip) => {
              if (!profile.dealBreakers.includes(chip)) {
                update({ dealBreakers: [...profile.dealBreakers, chip] });
              }
            }}
            placeholder="+ Add"
          />
        </div>

        <button
          type="button"
          className={styles.cta}
          disabled={!isValid}
          onClick={() => onConfirm(profile)}
        >
          Start scanning →
        </button>
      </div>
    </div>
  );
}
