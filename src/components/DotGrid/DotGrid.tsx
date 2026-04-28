import styles from './DotGrid.module.css';

interface Props {
  spacing?: number;
  dotSize?: number;
}

export function DotGrid({ spacing = 32, dotSize = 1 }: Props) {
  return (
    <svg className={styles.root} aria-hidden="true">
      <defs>
        <pattern id="dotgrid" width={spacing} height={spacing} patternUnits="userSpaceOnUse">
          <circle cx={spacing / 2} cy={spacing / 2} r={dotSize} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dotgrid)" />
    </svg>
  );
}
