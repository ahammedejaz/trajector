import { useState } from 'react';
import styles from './TagChips.module.css';

interface Props {
  chips: string[];
  onRemove: (chip: string) => void;
  onAdd: (chip: string) => void;
  placeholder?: string;
}

export function TagChips({ chips, onRemove, onAdd, placeholder = 'Add...' }: Props) {
  const [draft, setDraft] = useState('');

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && draft.trim()) {
      e.preventDefault();
      onAdd(draft.trim());
      setDraft('');
    }
  }

  return (
    <div className={styles.root}>
      {chips.map((chip) => (
        <span key={chip} className={styles.chip}>
          {chip}
          <button
            type="button"
            className={styles.remove}
            onClick={() => onRemove(chip)}
            aria-label={`Remove ${chip}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        className={styles.input}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
    </div>
  );
}
