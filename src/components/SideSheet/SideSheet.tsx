import { useEffect, type ReactNode } from 'react';
import styles from './SideSheet.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function SideSheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.root} role="dialog" aria-modal="true" aria-label={title}>
      <div
        className={styles.backdrop}
        data-testid="sidesheet-backdrop"
        onClick={onClose}
      />
      <aside className={styles.panel}>
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <div className={styles.body}>{children}</div>
      </aside>
    </div>
  );
}
