import type { ReactNode } from 'react';
import styles from './Sidebar.module.css';

interface Props {
  children: ReactNode;
  footer?: ReactNode;
}

export function Sidebar({ children, footer }: Props) {
  return (
    <aside className={styles.root}>
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </aside>
  );
}
