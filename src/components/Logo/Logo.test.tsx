import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Logo } from './Logo';

describe('Logo', () => {
  it('renders the wordmark', () => {
    render(<Logo />);
    expect(screen.getByText('Trajector')).toBeInTheDocument();
  });

  it('respects size prop', () => {
    const { container } = render(<Logo size="sm" />);
    expect(container.querySelector('span')!.className).toMatch(/sm/);
  });
});
