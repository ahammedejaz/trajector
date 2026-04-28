import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SourceRow } from './SourceRow';

describe('SourceRow', () => {
  it('renders queued state', () => {
    render(<SourceRow label="LinkedIn" status="queued" />);
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('○')).toBeInTheDocument();
    expect(screen.getByText(/queued/i)).toBeInTheDocument();
  });

  it('renders scanning state', () => {
    render(<SourceRow label="LinkedIn" status="scanning" />);
    expect(screen.getByText('◐')).toBeInTheDocument();
    expect(screen.getByText(/scanning/i)).toBeInTheDocument();
  });

  it('renders done state with count', () => {
    render(<SourceRow label="LinkedIn" status="done" count={4} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByText(/4 found/i)).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(<SourceRow label="LinkedIn" status="error" />);
    expect(screen.getByText('✗')).toBeInTheDocument();
    expect(screen.getByText(/failed/i)).toBeInTheDocument();
  });
});
