import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppBar } from './AppBar';

describe('AppBar', () => {
  it('renders brand mark', () => {
    render(<AppBar showCta={false} />);
    expect(screen.getByText('Trajector')).toBeInTheDocument();
  });

  it('renders nav links', () => {
    render(<AppBar showCta={false} />);
    expect(screen.getByRole('link', { name: /product/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /how it works/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /faq/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /github/i })).toBeInTheDocument();
  });

  it('shows the CTA when showCta is true', () => {
    render(<AppBar showCta />);
    expect(screen.getByRole('link', { name: /drop your resume/i })).toBeInTheDocument();
  });

  it('hides the CTA when showCta is false', () => {
    render(<AppBar showCta={false} />);
    expect(screen.queryByRole('link', { name: /drop your resume/i })).not.toBeInTheDocument();
  });

  it('calls onBrandClick when the brand mark is clicked', async () => {
    const user = userEvent.setup();
    const onBrandClick = vi.fn();
    render(<AppBar showCta={false} onBrandClick={onBrandClick} />);
    await user.click(screen.getByRole('button', { name: /trajector home/i }));
    expect(onBrandClick).toHaveBeenCalled();
  });
});
