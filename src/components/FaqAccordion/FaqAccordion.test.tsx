import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FaqAccordion } from './FaqAccordion';

describe('FaqAccordion', () => {
  it('renders all five questions', () => {
    render(<FaqAccordion />);
    expect(screen.getAllByRole('group')).toHaveLength(5);
    expect(screen.getByText(/where does my data go/i)).toBeInTheDocument();
  });

  it('reveals answer when question is clicked', async () => {
    const user = userEvent.setup();
    render(<FaqAccordion />);
    const summary = screen.getByText(/where does my data go/i);
    await user.click(summary);
    expect(screen.getByText(/nowhere/i)).toBeVisible();
  });
});
