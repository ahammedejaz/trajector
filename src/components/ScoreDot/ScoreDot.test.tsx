import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ScoreDot } from './ScoreDot';

describe('ScoreDot', () => {
  it('renders a strong tier dot', () => {
    const { container } = render(<ScoreDot tier="strong" />);
    const dot = container.querySelector('span');
    expect(dot).not.toBeNull();
    expect(dot!.className).toMatch(/strong/);
  });

  it('renders a decent tier dot', () => {
    const { container } = render(<ScoreDot tier="decent" />);
    expect(container.querySelector('span')!.className).toMatch(/decent/);
  });

  it('renders a skip tier dot', () => {
    const { container } = render(<ScoreDot tier="skip" />);
    expect(container.querySelector('span')!.className).toMatch(/skip/);
  });

  it('forwards aria-label when provided', () => {
    const { container } = render(<ScoreDot tier="strong" ariaLabel="Strong match" />);
    expect(container.querySelector('span')!.getAttribute('aria-label')).toBe('Strong match');
  });
});
