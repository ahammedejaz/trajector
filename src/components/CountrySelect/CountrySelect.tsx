import { useEffect, useRef, useState } from 'react';
import { COUNTRIES } from '../../lib/countries';
import styles from './CountrySelect.module.css';

interface Props {
  value: string | null;
  onChange: (next: string | null) => void;
}

export function CountrySelect({ value, onChange }: Props) {
  const [draft, setDraft] = useState(value ?? '');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(value ?? '');
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const matches =
    draft.length === 0
      ? COUNTRIES.slice(0, 8)
      : COUNTRIES.filter((c) => c.toLowerCase().includes(draft.toLowerCase())).slice(0, 8);

  function pick(c: string) {
    setDraft(c);
    setOpen(false);
    onChange(c);
  }

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setDraft(next);
    setOpen(true);
    if (next.trim() === '') onChange(null);
  }

  return (
    <div ref={rootRef} className={styles.root}>
      <input
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        className={styles.input}
        value={draft}
        placeholder="Start typing your country…"
        onChange={onInput}
        onFocus={() => setOpen(true)}
      />
      {open && matches.length > 0 && (
        <ul className={styles.list} role="listbox">
          {matches.map((c) => (
            <li key={c}>
              <button
                type="button"
                role="option"
                aria-selected={c === value}
                className={styles.option}
                onClick={() => pick(c)}
              >
                {c}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
