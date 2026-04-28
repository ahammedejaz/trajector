import { useState } from 'react';
import type { ResumeText, Profile, Screen } from './types';
import { loadSettings } from './lib/storage';
import { extractProfile } from './lib/extractProfile';
import { Upload } from './screens/Upload/Upload';
import { Settings } from './screens/Settings/Settings';
import { Confirm } from './screens/Confirm/Confirm';
import { StubScan } from './screens/StubScan/StubScan';
import styles from './App.module.css';

export function App() {
  const [screen, setScreen] = useState<Screen>('upload');
  const [resume, setResume] = useState<ResumeText | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [prevScreen, setPrevScreen] = useState<Screen>('upload');

  async function runExtract(rt: ResumeText, key: string, model: string) {
    setScreen('analyzing');
    setAnalyzeError(null);
    try {
      const p = await extractProfile(rt.text, key, model);
      setProfile(p);
      setScreen('confirm');
    } catch (err) {
      setAnalyzeError(
        err instanceof Error
          ? err.message
          : 'Analysis failed. Check your OpenRouter key in Settings.',
      );
      setScreen('upload');
    }
  }

  async function handleResumeParsed(rt: ResumeText) {
    setResume(rt);
    setAnalyzeError(null);
    const settings = loadSettings();
    if (!settings.openRouterKey) {
      setPrevScreen('upload');
      setScreen('settings');
      return;
    }
    await runExtract(rt, settings.openRouterKey, settings.model);
  }

  async function handleSettingsDone() {
    const settings = loadSettings();
    const pending = resume;
    if (prevScreen === 'upload' && pending && settings.openRouterKey) {
      await runExtract(pending, settings.openRouterKey, settings.model);
    } else {
      setScreen(prevScreen);
    }
  }

  function handleConfirm(p: Profile) {
    setProfile(p);
    setScreen('stubScan');
  }

  function handleReset() {
    setResume(null);
    setProfile(null);
    setAnalyzeError(null);
    setScreen('upload');
  }

  if (screen === 'analyzing') {
    return (
      <div className={styles.root}>
        <div className={styles.analyzing}>
          <p className={styles.analyzingText}>Analyzing your resume…</p>
        </div>
      </div>
    );
  }

  if (screen === 'settings') {
    return (
      <div className={styles.root}>
        <Settings onDone={handleSettingsDone} />
      </div>
    );
  }

  if (screen === 'confirm' && profile) {
    return (
      <div className={styles.root}>
        <Confirm profile={profile} onConfirm={handleConfirm} />
      </div>
    );
  }

  if (screen === 'stubScan' && profile) {
    return (
      <div className={styles.root}>
        <StubScan profile={profile} onReset={handleReset} />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Upload onResumeParsed={handleResumeParsed} analyzeError={analyzeError} />
    </div>
  );
}
