import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HowItWorksStrip } from './HowItWorksStrip';

describe('HowItWorksStrip', () => {
  it('renders four numbered steps', () => {
    render(<HowItWorksStrip />);
    expect(screen.getByText(/drop your resume/i)).toBeInTheDocument();
    expect(screen.getByText(/confirm your profile/i)).toBeInTheDocument();
    expect(screen.getByText(/scan enabled sources/i)).toBeInTheDocument();
    expect(screen.getByText(/triage matches/i)).toBeInTheDocument();
  });
});
