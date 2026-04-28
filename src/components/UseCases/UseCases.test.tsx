import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UseCases } from './UseCases';

describe('UseCases', () => {
  it('renders the heading', () => {
    render(<UseCases />);
    expect(screen.getByRole('heading', { name: /who.*for/i })).toBeInTheDocument();
  });

  it('renders all three persona cards', () => {
    render(<UseCases />);
    expect(screen.getByText(/senior ic/i)).toBeInTheDocument();
    expect(screen.getByText(/active job seeker/i)).toBeInTheDocument();
    expect(screen.getByText(/career changer/i)).toBeInTheDocument();
  });
});
