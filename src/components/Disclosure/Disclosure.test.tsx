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

  it('hides children when closed', () => {
    render(
      <Disclosure title="Section">
        <p>Body</p>
      </Disclosure>,
    );
    expect(screen.queryByText('Body')).not.toBeInTheDocument();
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
