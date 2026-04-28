import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiPill } from './MultiPill';

const OPTS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
];

describe('MultiPill', () => {
  it('marks selected pills as pressed', () => {
    render(<MultiPill options={OPTS} value={['a', 'c']} onChange={() => {}} ariaLabel="Pick" />);
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Beta' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Gamma' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('toggles a value on click — adds when missing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiPill options={OPTS} value={['a']} onChange={onChange} ariaLabel="Pick" />);
    await user.click(screen.getByRole('button', { name: 'Beta' }));
    expect(onChange).toHaveBeenCalledWith(['a', 'b']);
  });

  it('toggles a value on click — removes when present', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiPill options={OPTS} value={['a', 'b']} onChange={onChange} ariaLabel="Pick" />);
    await user.click(screen.getByRole('button', { name: 'Alpha' }));
    expect(onChange).toHaveBeenCalledWith(['b']);
  });
});
