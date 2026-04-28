import { useState } from 'react';
import { Upload } from './screens/Upload/Upload';
import { StubResult } from './screens/StubResult/StubResult';
import type { ResumeText, Screen } from './types';
import styles from './App.module.css';

export function App() {
  const [screen, setScreen] = useState<Screen>('upload');
  const [resume, setResume] = useState<ResumeText | null>(null);

  return (
    <div className={styles.root}>
      {screen === 'upload' && (
        <Upload
          onResumeParsed={(parsed) => {
            setResume(parsed);
            setScreen('stubResult');
          }}
        />
      )}
      {screen === 'stubResult' && resume && (
        <StubResult
          resume={resume}
          onReset={() => {
            setResume(null);
            setScreen('upload');
          }}
        />
      )}
    </div>
  );
}
