import styles from './MultiPill.module.css';

export interface MultiPillOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: readonly MultiPillOption<T>[];
  value: T[];
  onChange: (next: T[]) => void;
  ariaLabel: string;
}

export function MultiPill<T extends string>({ options, value, onChange, ariaLabel }: Props<T>) {
  function toggle(v: T) {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  }
  return (
    <div className={styles.root} role="group" aria-label={ariaLabel}>
      {options.map((opt) => {
        const on = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={on}
            className={`${styles.pill}${on ? ` ${styles.on}` : ''}`}
            onClick={() => toggle(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
