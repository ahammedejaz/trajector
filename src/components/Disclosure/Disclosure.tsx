import { useState, type ReactNode } from 'react';
import styles from './Disclosure.module.css';

interface Props {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  rightSlot?: ReactNode;
}

export function Disclosure({ title, children, defaultOpen = false, open, onOpenChange, rightSlot }: Props) {
  const [internal, setInternal] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internal;

  function toggle() {
    const next = !isOpen;
    if (!isControlled) setInternal(next);
    onOpenChange?.(next);
  }

  return (
    <section className={styles.root}>
      <button type="button" className={styles.header} aria-expanded={isOpen} onClick={toggle}>
        <span className={`${styles.caret}${isOpen ? ` ${styles.caretOpen}` : ''}`}>▸</span>
        <span className={styles.title}>{title}</span>
        {rightSlot && <span className={styles.right}>{rightSlot}</span>}
      </button>
      <div
        className={`${styles.bodyWrap}${isOpen ? ` ${styles.bodyWrapOpen}` : ''}`}
        aria-hidden={!isOpen}
      >
        <div className={styles.body}>{children}</div>
      </div>
    </section>
  );
}
