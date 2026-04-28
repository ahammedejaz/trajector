import styles from './OnboardingStepper.module.css';

export type StepKey = 'resume' | 'profile' | 'scan' | 'results';

interface Step {
  key: StepKey;
  label: string;
}

const STEPS: Step[] = [
  { key: 'resume', label: 'Resume' },
  { key: 'profile', label: 'Profile' },
  { key: 'scan', label: 'Scan' },
  { key: 'results', label: 'Results' },
];

interface Props {
  currentStep: StepKey;
  completed: StepKey[];
  onStepClick?: (step: StepKey) => void;
}

export function OnboardingStepper({ currentStep, completed, onStepClick }: Props) {
  const completedSet = new Set(completed);

  return (
    <ol className={styles.root}>
      {STEPS.map((step, i) => {
        const isCurrent = step.key === currentStep;
        const isDone = completedSet.has(step.key) && !isCurrent;
        const isInteractive = isDone && onStepClick;

        const content = (
          <>
            <span className={`${styles.dot} ${isCurrent ? styles.dotActive : isDone ? styles.dotDone : ''}`} />
            <span className={`${styles.label} ${isCurrent ? styles.labelActive : ''}`}>{step.label}</span>
          </>
        );

        return (
          <li key={step.key} className={styles.item} aria-current={isCurrent ? 'step' : undefined}>
            {isInteractive ? (
              <button type="button" className={styles.stepButton} onClick={() => onStepClick(step.key)}>
                {content}
              </button>
            ) : (
              <span className={styles.stepStatic}>{content}</span>
            )}
            {i < STEPS.length - 1 && (
              <span className={`${styles.connector} ${isDone ? styles.connectorDone : ''}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
