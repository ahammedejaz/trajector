import type { Profile } from '../../types';
import styles from './ProfileSummary.module.css';

interface Props {
  profile: Profile;
  onEdit: () => void;
}

export function ProfileSummary({ profile, onEdit }: Props) {
  const meta = [
    profile.level,
    profile.yearsOfExperience !== null ? `${profile.yearsOfExperience} yrs` : null,
    profile.country,
  ]
    .filter(Boolean)
    .join(' · ');

  const stack = profile.stackSignals.slice(0, 4).join(', ');

  return (
    <div className={styles.root}>
      <p className={styles.role}>{profile.targetRole}</p>
      <p className={styles.meta}>{meta}</p>
      {stack && <p className={styles.stack}>{stack}</p>}
      <button type="button" className={styles.edit} onClick={onEdit}>
        Edit profile
      </button>
    </div>
  );
}
