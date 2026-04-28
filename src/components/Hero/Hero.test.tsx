import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Hero } from './Hero';

describe('Hero', () => {
  it('renders eyebrow, headline, and sub', () => {
    render(<Hero rightSlot={<div>preview</div>} onPrimaryClick={() => {}} onSecondaryClick={() => {}} />);
    expect(screen.getByText(/open-source.*local-first/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /find the few jobs/i })).toBeInTheDocument();
    expect(screen.getByText(/your resume and your api key/i)).toBeInTheDocument();
  });

  it('renders the right slot', () => {
    render(<Hero rightSlot={<div>preview content</div>} onPrimaryClick={() => {}} onSecondaryClick={() => {}} />);
    expect(screen.getByText('preview content')).toBeInTheDocument();
  });

  it('calls onPrimaryClick when primary CTA clicked', async () => {
    const user = userEvent.setup();
    const onPrimary = vi.fn();
    render(<Hero rightSlot={<div />} onPrimaryClick={onPrimary} onSecondaryClick={() => {}} />);
    await user.click(screen.getByRole('button', { name: /drop your resume/i }));
    expect(onPrimary).toHaveBeenCalled();
  });

  it('calls onSecondaryClick when secondary CTA clicked', async () => {
    const user = userEvent.setup();
    const onSecondary = vi.fn();
    render(<Hero rightSlot={<div />} onPrimaryClick={() => {}} onSecondaryClick={onSecondary} />);
    await user.click(screen.getByRole('button', { name: /see an example/i }));
    expect(onSecondary).toHaveBeenCalled();
  });
});
