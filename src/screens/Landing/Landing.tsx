import type { ResumeText } from '../../types';
import { Upload } from '../Upload/Upload';
import { Hero } from '../../components/Hero/Hero';
import { TrustBar } from '../../components/TrustBar/TrustBar';
import { FeatureGrid } from '../../components/FeatureGrid/FeatureGrid';
import { HowItWorksStrip } from '../../components/HowItWorksStrip/HowItWorksStrip';
import { FaqAccordion } from '../../components/FaqAccordion/FaqAccordion';
import { Footer } from '../../components/Footer/Footer';
import { DemoPreview } from '../../components/DemoPreview/DemoPreview';
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
        rightSlot={<DemoPreview />}
        onPrimaryClick={() => scrollTo('drop')}
        onSecondaryClick={() => scrollTo('features')}
      />
      <TrustBar />
      <FeatureGrid />
      <HowItWorksStrip />
      <section id="drop" className={styles.dropSection}>
        <div className={styles.dropInner}>
          <Upload onResumeParsed={onResumeParsed} analyzeError={analyzeError} />
        </div>
      </section>
      <FaqAccordion />
      <Footer />
    </div>
  );
}
