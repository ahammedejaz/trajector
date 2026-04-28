import type { ElementType, ReactNode } from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import styles from './Reveal.module.css';

interface Props {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delayMs?: number;
}

export function Reveal({ children, as: Tag = 'div', className = '', delayMs = 0 }: Props) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  const style = delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined;
  return (
    <Tag
      ref={ref}
      className={`${styles.root}${visible ? ` ${styles.visible}` : ''} ${className}`}
      style={style}
    >
      {children}
    </Tag>
  );
}
