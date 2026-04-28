import styles from './ComparisonTable.module.css';

type Cell = { kind: 'check' } | { kind: 'cross' } | { kind: 'text'; value: string };

interface Row {
  label: string;
  trajector: Cell;
  spreadsheet: Cell;
  boards: Cell;
}

const ROWS: Row[] = [
  {
    label: 'Auto-scored matches',
    trajector: { kind: 'check' },
    spreadsheet: { kind: 'cross' },
    boards: { kind: 'cross' },
  },
  {
    label: 'Honors comp floor',
    trajector: { kind: 'check' },
    spreadsheet: { kind: 'text', value: 'manual' },
    boards: { kind: 'cross' },
  },
  {
    label: 'Honors deal-breakers',
    trajector: { kind: 'check' },
    spreadsheet: { kind: 'text', value: 'manual' },
    boards: { kind: 'cross' },
  },
  {
    label: 'Data stays in browser',
    trajector: { kind: 'check' },
    spreadsheet: { kind: 'check' },
    boards: { kind: 'cross' },
  },
  {
    label: 'Cost at zero use',
    trajector: { kind: 'text', value: '$0' },
    spreadsheet: { kind: 'text', value: '$0' },
    boards: { kind: 'text', value: 'ad-funded' },
  },
];

function CellView({ cell }: { cell: Cell }) {
  if (cell.kind === 'check') return <span className={styles.check}>✓</span>;
  if (cell.kind === 'cross') return <span className={styles.cross}>✗</span>;
  return <span className={styles.cellText}>{cell.value}</span>;
}

export function ComparisonTable() {
  return (
    <section className={styles.root}>
      <div className={styles.inner}>
        <h2 className={styles.title}>Vs the alternatives</h2>
        <p className={styles.subtitle}>
          What you get with Trajector that you don't get from the usual job-search workflow.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th className={styles.colHighlight}>Trajector</th>
                <th>Manual spreadsheet</th>
                <th>Job boards</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.label}>
                  <td className={styles.rowLabel}>{r.label}</td>
                  <td className={styles.colHighlight}><CellView cell={r.trajector} /></td>
                  <td><CellView cell={r.spreadsheet} /></td>
                  <td><CellView cell={r.boards} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
