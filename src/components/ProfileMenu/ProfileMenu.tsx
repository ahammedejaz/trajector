import { useEffect, useRef, useState } from 'react';
import styles from './ProfileMenu.module.css';

interface Props {
  onEditProfile: () => void;
  onSwitchResume: () => void;
  onOpenSettings: () => void;
}

export function ProfileMenu({ onEditProfile, onSwitchResume, onOpenSettings }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  function pick(fn: () => void) {
    setOpen(false);
    fn();
  }

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        type="button"
        className={styles.trigger}
        aria-label="Profile menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.avatar} />
      </button>
      {open && (
        <ul className={styles.menu} role="menu">
          <li>
            <button type="button" role="menuitem" className={styles.item} onClick={() => pick(onEditProfile)}>
              Edit profile
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" className={styles.item} onClick={() => pick(onSwitchResume)}>
              Switch resume
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" className={styles.item} onClick={() => pick(onOpenSettings)}>
              Settings
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
