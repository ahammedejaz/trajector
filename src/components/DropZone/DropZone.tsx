import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import styles from './DropZone.module.css';

export type DropZoneState = 'idle' | 'reading' | 'error';

interface DropZoneProps {
  state: DropZoneState;
  errorMessage?: string;
  onFileSelected: (file: File) => void;
}

export function DropZone({ state, errorMessage, onFileSelected }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleClick = () => {
    if (state === 'reading') return;
    inputRef.current?.click();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    e.target.value = '';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (state === 'reading') return;
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (state === 'reading') return;
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  };

  const className = [
    styles.zone,
    isDragOver && styles.dragover,
    state === 'reading' && styles.reading,
    state === 'error' && styles.error,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={className}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.md,.markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown"
        className={styles.input}
        onChange={handleChange}
        aria-label="Drop here or click to browse"
      />
      {state === 'idle' && (
        <>
          <p className={styles.primary}>Drop here</p>
          <p className={styles.secondary}>or click to browse</p>
        </>
      )}
      {state === 'reading' && <p className={styles.secondary}>Reading your resume…</p>}
      {state === 'error' && (
        <p className={styles['error-text']}>{errorMessage ?? "Couldn't read this file."}</p>
      )}
    </div>
  );
}
