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
});
