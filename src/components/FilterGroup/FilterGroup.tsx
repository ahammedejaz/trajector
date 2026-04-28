import type { ReactNode } from 'react';
import styles from './FilterGroup.module.css';

interface Props {
  title: string;
  children: ReactNode;
}

export function FilterGroup({ title, children }: Props) {
  return (
    <section className={styles.root}>
      <p className={styles.title}>{title}</p>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
