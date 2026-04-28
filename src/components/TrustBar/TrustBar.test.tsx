import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrustBar } from './TrustBar';

describe('TrustBar', () => {
  it('renders the privacy line', () => {
    render(<TrustBar />);
    expect(screen.getByText(/never leave your browser/i)).toBeInTheDocument();
  });
});
