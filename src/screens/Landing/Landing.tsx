import type { ResumeText } from '../../types';
import { Upload } from '../Upload/Upload';
import { Hero } from '../../components/Hero/Hero';
import { TrustBar } from '../../components/TrustBar/TrustBar';
import { StatsRow } from '../../components/StatsRow/StatsRow';
import { FeatureGrid } from '../../components/FeatureGrid/FeatureGrid';
import { HowItScores } from '../../components/HowItScores/HowItScores';
import { HowItWorksStrip } from '../../components/HowItWorksStrip/HowItWorksStrip';
import { ComparisonTable } from '../../components/ComparisonTable/ComparisonTable';
import { UseCases } from '../../components/UseCases/UseCases';
import { FaqAccordion } from '../../components/FaqAccordion/FaqAccordion';
import { LocalFirstDiagram } from '../../components/LocalFirstDiagram/LocalFirstDiagram';
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
      <StatsRow />
      <FeatureGrid />
      <HowItScores />
      <HowItWorksStrip />
      <ComparisonTable />
      <UseCases />
      <section id="drop" className={styles.dropSection}>
        <div className={styles.dropInner}>
          <Upload onResumeParsed={onResumeParsed} analyzeError={analyzeError} />
        </div>
      </section>
      <FaqAccordion />
      <LocalFirstDiagram />
      <Footer />
    </div>
  );
}
