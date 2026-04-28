import { useState } from 'react';
import { DropZone, type DropZoneState } from '../../components/DropZone/DropZone';
import { parseResume } from '../../lib/parseResume';
import type { ResumeText } from '../../types';
import styles from './Upload.module.css';

interface UploadProps {
  onResumeParsed: (resume: ResumeText) => void;
  analyzeError?: string | null;
}

export function Upload({ onResumeParsed, analyzeError }: UploadProps) {
  const [zoneState, setZoneState] = useState<DropZoneState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleFile = async (file: File) => {
    setZoneState('reading');
    setErrorMessage(undefined);
    try {
      const result = await parseResume(file);
      onResumeParsed(result);
    } catch {
      setErrorMessage("Couldn't read this file. Try DOCX or markdown.");
      setZoneState('error');
    }
  };

  const displayError =
    zoneState === 'idle' && analyzeError ? analyzeError : errorMessage;

  const displayState: DropZoneState =
    zoneState === 'idle' && analyzeError ? 'error' : zoneState;

  return (
    <div className={styles.page}>
      <div className={styles.header}>Trajector</div>
      <div className={styles.body}>
        <div className={styles.column}>
          <div className={styles['headline-group']}>
            <h1 className={styles.headline}>Drop your resume to begin</h1>
            <p className={styles.subhead}>PDF, DOCX, or markdown · stays on your machine</p>
          </div>
          <DropZone
            state={displayState}
            errorMessage={displayError}
            onFileSelected={handleFile}
          />
          <p className={styles.reassurance}>
            No account. No upload to a server.
            <br />
            Parsed locally, evaluated locally.
          </p>
        </div>
      </div>
    </div>
  );
}
