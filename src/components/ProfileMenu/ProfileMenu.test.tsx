import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileMenu } from './ProfileMenu';

describe('ProfileMenu', () => {
  function setup() {
    const onEditProfile = vi.fn();
    const onSwitchResume = vi.fn();
    const onOpenSettings = vi.fn();
    render(
      <ProfileMenu
        onEditProfile={onEditProfile}
        onSwitchResume={onSwitchResume}
        onOpenSettings={onOpenSettings}
      />,
    );
    return { onEditProfile, onSwitchResume, onOpenSettings };
  }

  it('renders the menu button collapsed', () => {
    setup();
    expect(screen.getByRole('button', { name: /profile menu/i })).toBeInTheDocument();
    expect(screen.queryByText('Edit profile')).not.toBeInTheDocument();
  });

  it('opens menu and triggers edit profile', async () => {
    const user = userEvent.setup();
    const { onEditProfile } = setup();
    await user.click(screen.getByRole('button', { name: /profile menu/i }));
    await user.click(screen.getByRole('menuitem', { name: /edit profile/i }));
    expect(onEditProfile).toHaveBeenCalled();
  });

  it('triggers switch resume', async () => {
    const user = userEvent.setup();
    const { onSwitchResume } = setup();
    await user.click(screen.getByRole('button', { name: /profile menu/i }));
    await user.click(screen.getByRole('menuitem', { name: /switch resume/i }));
    expect(onSwitchResume).toHaveBeenCalled();
  });

  it('triggers open settings', async () => {
    const user = userEvent.setup();
    const { onOpenSettings } = setup();
    await user.click(screen.getByRole('button', { name: /profile menu/i }));
    await user.click(screen.getByRole('menuitem', { name: /^settings/i }));
    expect(onOpenSettings).toHaveBeenCalled();
  });

  it('closes when clicking outside', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /profile menu/i }));
    expect(screen.getByText('Edit profile')).toBeInTheDocument();
    await user.click(document.body);
    expect(screen.queryByText('Edit profile')).not.toBeInTheDocument();
  });
});
