import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LocalFirstDiagram } from './LocalFirstDiagram';

describe('LocalFirstDiagram', () => {
  it('renders the heading', () => {
    render(<LocalFirstDiagram />);
    expect(screen.getByRole('heading', { name: /local-first/i })).toBeInTheDocument();
  });

  it('renders both nodes', () => {
    render(<LocalFirstDiagram />);
    expect(screen.getByText('Your browser')).toBeInTheDocument();
    expect(screen.getAllByText(/openrouter/i).length).toBeGreaterThan(0);
  });

  it('renders the no-server caption', () => {
    render(<LocalFirstDiagram />);
    expect(screen.getByText(/no trajector servers/i)).toBeInTheDocument();
  });
});
