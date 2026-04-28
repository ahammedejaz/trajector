import styles from './RangeSlider.module.css';

interface Props {
  min: number;
  max: number;
  value: number;
  onChange: (next: number) => void;
  ariaLabel: string;
}

export function RangeSlider({ min, max, value, onChange, ariaLabel }: Props) {
  return (
    <div className={styles.root}>
      <input
        type="range"
        className={styles.input}
        min={min}
        max={max}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className={styles.value}>{value}</span>
    </div>
  );
}
