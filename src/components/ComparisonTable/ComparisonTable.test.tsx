import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComparisonTable } from './ComparisonTable';

describe('ComparisonTable', () => {
  it('renders the heading', () => {
    render(<ComparisonTable />);
    expect(screen.getByRole('heading', { name: /vs the alternatives/i })).toBeInTheDocument();
  });

  it('renders all three columns', () => {
    render(<ComparisonTable />);
    expect(screen.getByText('Trajector')).toBeInTheDocument();
    expect(screen.getByText(/spreadsheet/i)).toBeInTheDocument();
    expect(screen.getByText(/job boards/i)).toBeInTheDocument();
  });

  it('renders rows for key features', () => {
    render(<ComparisonTable />);
    expect(screen.getByText(/auto-scored matches/i)).toBeInTheDocument();
    expect(screen.getByText(/honors comp floor/i)).toBeInTheDocument();
    expect(screen.getByText(/data stays in browser/i)).toBeInTheDocument();
  });
});
