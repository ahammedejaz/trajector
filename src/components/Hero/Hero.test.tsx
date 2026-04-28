import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Hero } from './Hero';

describe('Hero', () => {
  it('renders eyebrow, headline, and sub', () => {
    render(<Hero rightSlot={<div>preview</div>} onSecondaryClick={() => {}} />);
    expect(screen.getByText(/open-source.*local-first/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /find the few jobs/i })).toBeInTheDocument();
    expect(screen.getByText(/your resume and your api key/i)).toBeInTheDocument();
  });

  it('renders the right slot', () => {
    render(<Hero rightSlot={<div>slot content</div>} onSecondaryClick={() => {}} />);
    expect(screen.getByText('slot content')).toBeInTheDocument();
  });

  it('does NOT render a primary "Drop your resume" button (drop zone is in the right slot)', () => {
    render(<Hero rightSlot={<div />} onSecondaryClick={() => {}} />);
    expect(screen.queryByRole('button', { name: /drop your resume/i })).not.toBeInTheDocument();
  });

  it('calls onSecondaryClick when secondary CTA clicked', async () => {
    const user = userEvent.setup();
    const onSecondary = vi.fn();
    render(<Hero rightSlot={<div />} onSecondaryClick={onSecondary} />);
    await user.click(screen.getByRole('button', { name: /see an example/i }));
    expect(onSecondary).toHaveBeenCalled();
  });
});
