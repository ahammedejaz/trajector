import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders the version and license', () => {
    render(<Footer />);
    expect(screen.getByText(/Trajector v0\.1/)).toBeInTheDocument();
    expect(screen.getByText(/MIT/)).toBeInTheDocument();
  });

  it('renders the GitHub link', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: /github/i })).toBeInTheDocument();
  });
});
