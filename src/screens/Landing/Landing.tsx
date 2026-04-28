import type { ResumeText } from '../../types';
import { Upload } from '../Upload/Upload';
import { Hero } from '../../components/Hero/Hero';
import { TrustBar } from '../../components/TrustBar/TrustBar';
import { FeatureGrid } from '../../components/FeatureGrid/FeatureGrid';
import { HowItScores } from '../../components/HowItScores/HowItScores';
import { FaqAccordion } from '../../components/FaqAccordion/FaqAccordion';
import { Footer } from '../../components/Footer/Footer';
import { DemoPreview } from '../../components/DemoPreview/DemoPreview';
import { Reveal } from '../../components/Reveal/Reveal';
import styles from './Landing.module.css';

interface Props {
  onResumeParsed: (rt: ResumeText) => void;
  analyzeError: string | null;
}

function scrollTo(id: string) {
  const el = document.getElementById(id);
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function Landing({ onResumeParsed, analyzeError }: Props) {
  return (
    <div className={styles.root}>
      <Hero
        rightSlot={<Upload onResumeParsed={onResumeParsed} analyzeError={analyzeError} />}
        onSecondaryClick={() => scrollTo('example')}
      />
      <Reveal><TrustBar /></Reveal>
      <Reveal><FeatureGrid /></Reveal>
      <Reveal>
        <section id="example" className={styles.exampleSection}>
          <div className={styles.exampleInner}>
            <p className={styles.exampleEyebrow}>See an example</p>
            <h2 className={styles.exampleTitle}>What a real scan looks like.</h2>
            <p className={styles.exampleSub}>
              A pre-rendered scan against a sample profile. Click any card to see the full job detail.
            </p>
            <div className={styles.exampleFrame}>
              <DemoPreview />
            </div>
          </div>
        </section>
      </Reveal>
      <Reveal><HowItScores /></Reveal>
      <Reveal><FaqAccordion /></Reveal>
      <Reveal><Footer /></Reveal>
    </div>
  );
}
