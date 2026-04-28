import styles from './Toggle.module.css';

interface Props {
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
}

export function Toggle({ checked, onChange, ariaLabel }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`${styles.root}${checked ? ` ${styles.on}` : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.knob} />
    </button>
  );
}
