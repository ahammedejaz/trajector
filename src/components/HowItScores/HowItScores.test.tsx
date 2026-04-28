import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HowItScores } from './HowItScores';

describe('HowItScores', () => {
  it('renders the heading', () => {
    render(<HowItScores />);
    expect(screen.getByRole('heading', { name: /how it scores/i })).toBeInTheDocument();
  });

  it('renders all four factors', () => {
    render(<HowItScores />);
    expect(screen.getByText(/stack alignment/i)).toBeInTheDocument();
    expect(screen.getByText(/comp/i)).toBeInTheDocument();
    expect(screen.getByText(/location.*country/i)).toBeInTheDocument();
    expect(screen.getByText(/stage.*size.*equity/i)).toBeInTheDocument();
  });
});
