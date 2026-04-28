import { useEffect, useState } from 'react';
import type { ResumeText, Profile, Screen } from './types';
import { loadSettings } from './lib/storage';
import { extractProfile } from './lib/extractProfile';
import { Landing } from './screens/Landing/Landing';
import { Upload } from './screens/Upload/Upload';
import { Settings } from './screens/Settings/Settings';
import { Confirm } from './screens/Confirm/Confirm';
import { Results } from './screens/Results/Results';
import { AppBar } from './components/AppBar/AppBar';
import { OnboardingStepper, type StepKey } from './components/OnboardingStepper/OnboardingStepper';
import styles from './App.module.css';

export function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [resume, setResume] = useState<ResumeText | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [prevScreen, setPrevScreen] = useState<Screen>('landing');
  const [scanFinished, setScanFinished] = useState(false);

  useEffect(() => {
    if (screen !== 'results') setScanFinished(false);
  }, [screen]);

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
    if ((prevScreen === 'upload' || prevScreen === 'landing') && pending && settings.openRouterKey) {
      await runExtract(pending, settings.openRouterKey, settings.model);
    } else {
      setScreen(prevScreen);
    }
  }

  function handleConfirm(p: Profile) {
    setProfile(p);
    setScreen('results');
  }

  function handleEditProfile() {
    setScreen('confirm');
  }

  function handleSwitchResume() {
    setResume(null);
    setProfile(null);
    setAnalyzeError(null);
    setScreen('upload');
  }

  function handleOpenSettingsFromResults() {
    setPrevScreen('results');
    setScreen('settings');
  }

  function handleBrandClick() {
    setScreen('landing');
  }

  function handleStepperClick(step: StepKey) {
    if (step === 'resume') setScreen('upload');
    else if (step === 'profile' && profile) setScreen('confirm');
    else if (step === 'scan' || step === 'results') setScreen('results');
  }

  const showAppBarCta = screen === 'landing';
  const showStepper = screen !== 'landing';

  let currentStep: StepKey = 'resume';
  if (screen === 'analyzing' || (screen === 'settings' && prevScreen !== 'results')) currentStep = 'profile';
  else if (screen === 'confirm') currentStep = 'profile';
  else if (screen === 'results' && !scanFinished) currentStep = 'scan';
  else if (screen === 'results' && scanFinished) currentStep = 'results';
  else if (screen === 'settings' && prevScreen === 'results') currentStep = 'results';

  const completed: StepKey[] = [];
  if (resume) completed.push('resume');
  if (profile) completed.push('profile');
  if (scanFinished) completed.push('scan');

  return (
    <div className={styles.root}>
      <AppBar showCta={showAppBarCta} onBrandClick={handleBrandClick} />
      {showStepper && (
        <div className={styles.stepperWrap}>
          <OnboardingStepper
            currentStep={currentStep}
            completed={completed}
            onStepClick={handleStepperClick}
          />
        </div>
      )}

      {screen === 'landing' && (
        <Landing onResumeParsed={handleResumeParsed} analyzeError={analyzeError} />
      )}

      {screen === 'upload' && (
        <div className={styles.screen}>
          <Upload onResumeParsed={handleResumeParsed} analyzeError={analyzeError} />
        </div>
      )}

      {screen === 'analyzing' && (
        <div className={styles.screen}>
          <div className={styles.analyzing}>
            <div className={styles.dots} aria-hidden="true">
              <span className={`${styles.dot} ${styles.dotStrong}`} />
              <span className={`${styles.dot} ${styles.dotDecent}`} />
              <span className={`${styles.dot} ${styles.dotSkip}`} />
            </div>
            <p className={styles.analyzingText}>Analyzing your resume…</p>
            <p className={styles.analyzingSub}>
              Extracting your profile from the resume — usually a few seconds.
            </p>
          </div>
        </div>
      )}

      {screen === 'settings' && (
        <div className={styles.screen}>
          <Settings onDone={handleSettingsDone} />
        </div>
      )}

      {screen === 'confirm' && profile && (
        <div className={styles.screen}>
          <Confirm
            profile={profile}
            onConfirm={handleConfirm}
            onSaveAndExit={() => setScreen('landing')}
          />
        </div>
      )}

      {screen === 'results' && profile && (
        <div className={styles.screen}>
          <Results
            profile={profile}
            onEditProfile={handleEditProfile}
            onSwitchResume={handleSwitchResume}
            onOpenSettings={handleOpenSettingsFromResults}
            onScanFinished={() => setScanFinished(true)}
          />
        </div>
      )}
    </div>
  );
}
