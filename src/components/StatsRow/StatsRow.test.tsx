import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsRow } from './StatsRow';

describe('StatsRow', () => {
  it('renders all four KPIs', () => {
    render(<StatsRow />);
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText(/jobs scored per scan/i)).toBeInTheDocument();
    expect(screen.getByText(/~\$0\.01/)).toBeInTheDocument();
    expect(screen.getByText(/cost per scan/i)).toBeInTheDocument();
    expect(screen.getByText('8s')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText(/servers, accounts, or data/i)).toBeInTheDocument();
  });
});
