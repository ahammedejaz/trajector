import type { SourceStatus } from '../../types';
import styles from './SourceRow.module.css';

interface Props {
  label: string;
  status: SourceStatus;
  count?: number;
}

const GLYPH: Record<SourceStatus, string> = {
  queued: '○',
  scanning: '◐',
  done: '✓',
  error: '✗',
};

function statusText(status: SourceStatus, count?: number): string {
  if (status === 'queued') return 'Queued';
  if (status === 'scanning') return 'Scanning…';
  if (status === 'done') return typeof count === 'number' ? `${count} found` : 'Done';
  return 'Failed';
}

export function SourceRow({ label, status, count }: Props) {
  return (
    <div className={`${styles.row}${status === 'scanning' ? ` ${styles.scanningRow}` : ''}`}>
      <span className={`${styles.glyph} ${styles[status]}`}>{GLYPH[status]}</span>
      <span className={styles.label}>{label}</span>
      <span className={styles.status}>{statusText(status, count)}</span>
    </div>
  );
}
