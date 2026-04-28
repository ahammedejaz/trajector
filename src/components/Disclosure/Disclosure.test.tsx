import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Disclosure } from './Disclosure';

describe('Disclosure', () => {
  it('renders children when initially open', () => {
    render(
      <Disclosure title="Section" defaultOpen>
        <p>Body</p>
      </Disclosure>,
    );
    expect(screen.getByText('Body')).toBeVisible();
  });

  it('marks the body as aria-hidden when closed', () => {
    const { container } = render(
      <Disclosure title="Section">
        <p>Body</p>
      </Disclosure>,
    );
    const wrap = container.querySelector('[aria-hidden="true"]');
    expect(wrap).toBeInTheDocument();
    expect(wrap?.textContent).toContain('Body');
  });

  it('toggles open on header click', async () => {
    const user = userEvent.setup();
    render(
      <Disclosure title="Section">
        <p>Body</p>
      </Disclosure>,
    );
    await user.click(screen.getByRole('button', { name: /section/i }));
    expect(screen.getByText('Body')).toBeVisible();
  });

  it('renders right slot content if provided', () => {
    render(
      <Disclosure title="Section" rightSlot={<span>3 to go</span>}>
        <p>Body</p>
      </Disclosure>,
    );
    expect(screen.getByText('3 to go')).toBeInTheDocument();
  });

  it('reflects controlled state when onOpenChange is provided', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Disclosure title="Section" open={false} onOpenChange={onOpenChange}>
        <p>Body</p>
      </Disclosure>,
    );
    await user.click(screen.getByRole('button', { name: /section/i }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    rerender(
      <Disclosure title="Section" open onOpenChange={onOpenChange}>
        <p>Body</p>
      </Disclosure>,
    );
    expect(screen.getByText('Body')).toBeVisible();
  });
});
