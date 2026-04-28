import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SideSheet } from './SideSheet';

describe('SideSheet', () => {
  it('renders nothing when closed', () => {
    render(
      <SideSheet open={false} onClose={() => {}} title="Job">
        <p>Hello</p>
      </SideSheet>,
    );
    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
  });

  it('renders children and title when open', () => {
    render(
      <SideSheet open onClose={() => {}} title="Job detail">
        <p>Body</p>
      </SideSheet>,
    );
    expect(screen.getByText('Job detail')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <SideSheet open onClose={onClose} title="Job">
        <p>Body</p>
      </SideSheet>,
    );
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <SideSheet open onClose={onClose} title="Job">
        <p>Body</p>
      </SideSheet>,
    );
    await user.click(screen.getByTestId('sidesheet-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <SideSheet open onClose={onClose} title="Job">
        <p>Body</p>
      </SideSheet>,
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
