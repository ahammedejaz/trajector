import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Landing } from './Landing';

vi.mock('../../screens/Upload/Upload', () => ({
  Upload: ({ analyzeError }: { analyzeError: string | null }) => (
    <div data-testid="upload-stub">{analyzeError ?? 'upload'}</div>
  ),
}));

describe('Landing', () => {
  it('renders Hero with the drop zone slotted in', () => {
    render(<Landing onResumeParsed={() => {}} analyzeError={null} />);
    expect(screen.getByRole('heading', { name: /find the few jobs/i })).toBeInTheDocument();
    expect(screen.getByTestId('upload-stub')).toBeInTheDocument();
  });

  it('renders TrustBar, FeatureGrid, DemoPreview, HowItScores, FAQ, Footer', () => {
    render(<Landing onResumeParsed={() => {}} analyzeError={null} />);
    expect(screen.getByText(/no accounts, no servers/i)).toBeInTheDocument(); // TrustBar
    expect(screen.getByText(/triage by tier/i)).toBeInTheDocument();             // FeatureGrid
    expect(screen.getByRole('heading', { name: /what a real scan looks like/i })).toBeInTheDocument(); // example section title
    expect(screen.getByText(/Senior Backend Engineer · senior · United States/)).toBeInTheDocument();  // DemoPreview profile summary
    expect(screen.getByRole('heading', { name: /how it scores/i })).toBeInTheDocument(); // HowItScores
    expect(screen.getByText(/where does my data go/i)).toBeInTheDocument();      // FAQ
    expect(screen.getByText(/Trajector v0\.1/)).toBeInTheDocument();             // Footer
  });

  it('does NOT render the cut sections', () => {
    render(<Landing onResumeParsed={() => {}} analyzeError={null} />);
    expect(screen.queryByText(/jobs scored per scan/i)).not.toBeInTheDocument(); // StatsRow
    expect(screen.queryByRole('heading', { name: /vs the alternatives/i })).not.toBeInTheDocument(); // ComparisonTable
    expect(screen.queryByRole('heading', { name: /who.*for/i })).not.toBeInTheDocument(); // UseCases
    expect(screen.queryByRole('heading', { name: /local-first by design/i })).not.toBeInTheDocument(); // LocalFirstDiagram
  });
});
