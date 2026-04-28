import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Landing } from './Landing';

vi.mock('../../screens/Upload/Upload', () => ({
  Upload: ({ analyzeError }: { analyzeError: string | null }) => (
    <div data-testid="upload-stub">{analyzeError ?? 'upload'}</div>
  ),
}));

describe('Landing', () => {
  it('renders Hero, FeatureGrid, FAQ, Footer, and drop zone', () => {
    render(<Landing onResumeParsed={() => {}} analyzeError={null} />);
    expect(screen.getByRole('heading', { name: /find the few jobs/i })).toBeInTheDocument();
    expect(screen.getByText(/triage by tier/i)).toBeInTheDocument();
    expect(screen.getByText(/where does my data go/i)).toBeInTheDocument();
    expect(screen.getByText(/Trajector v0\.1/)).toBeInTheDocument();
    expect(screen.getByTestId('upload-stub')).toBeInTheDocument();
  });

  it('renders the new polish sections', () => {
    render(<Landing onResumeParsed={() => {}} analyzeError={null} />);
    expect(screen.getByText(/jobs scored per scan/i)).toBeInTheDocument(); // StatsRow
    expect(screen.getByRole('heading', { name: /how it scores/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /vs the alternatives/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /who.*for/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /local-first by design/i })).toBeInTheDocument();
  });
});
