import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeatureGrid } from './FeatureGrid';

describe('FeatureGrid', () => {
  it('renders three feature headings', () => {
    render(<FeatureGrid />);
    expect(screen.getByText(/triage by tier/i)).toBeInTheDocument();
    expect(screen.getByText(/profile that actually matters/i)).toBeInTheDocument();
    expect(screen.getByText(/byo model/i)).toBeInTheDocument();
  });

  it('does NOT render the cut Plan-5 feature cards', () => {
    render(<FeatureGrid />);
    expect(screen.queryByText(/country-aware/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/sponsorship-respectful/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/open-source, mit/i)).not.toBeInTheDocument();
  });
});
