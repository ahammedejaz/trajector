import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders the bottom strip', () => {
    render(<Footer />);
    expect(screen.getByText(/Trajector v0\.1 · MIT/i)).toBeInTheDocument();
  });

  it('renders the GitHub link', () => {
    render(<Footer />);
    const githubLinks = screen.getAllByText(/github/i);
    expect(githubLinks.length).toBeGreaterThan(0);
  });

  it('renders all four columns', () => {
    render(<Footer />);
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });
});
