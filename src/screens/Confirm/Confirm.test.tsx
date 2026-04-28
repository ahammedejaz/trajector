import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Confirm } from './Confirm';
import type { Profile } from '../../types';

const PROFILE: Profile = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  yearsOfExperience: 7,
  stackSignals: ['Go', 'PostgreSQL'],
  employmentTypes: ['full-time'],
  compFloor: 200000,
  locationPreference: 'remote',
  country: 'United States',
  preferredLocations: [],
  requiresSponsorship: false,
  dealBreakers: [],
  companyStages: ['growth'],
  companySize: 'mid',
  equityImportance: 'nice',
  industriesToExclude: [],
  jobSearchStatus: 'open',
};

const EMPTY_PROFILE: Profile = {
  ...PROFILE,
  targetRole: '',
  yearsOfExperience: null,
  country: null,
  companyStages: [],
  companySize: null,
  equityImportance: null,
  jobSearchStatus: null,
  stackSignals: [],
};

beforeEach(() => localStorage.clear());

describe('Confirm screen', () => {
  it('renders all three section headers', () => {
    render(<Confirm profile={PROFILE} onConfirm={() => {}} />);
    expect(screen.getByRole('button', { name: /essentials/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logistics/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /preferences/i })).toBeInTheDocument();
  });

  it('renders target role and level by default in Essentials', () => {
    render(<Confirm profile={PROFILE} onConfirm={() => {}} />);
    expect(screen.getByLabelText(/target role/i)).toHaveValue('Senior Backend Engineer');
  });

  it('shows AI badge on inferred fields', () => {
    render(<Confirm profile={PROFILE} onConfirm={() => {}} />);
    const badges = screen.getAllByText('AI');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('hides AI badge after the user edits the field', async () => {
    const user = userEvent.setup();
    render(<Confirm profile={PROFILE} onConfirm={() => {}} />);
    const targetInput = screen.getByLabelText(/target role/i);
    const badgesBefore = screen.getAllByText('AI').length;
    await user.clear(targetInput);
    await user.type(targetInput, 'Backend Engineer');
    const badgesAfter = screen.getAllByText('AI').length;
    expect(badgesAfter).toBe(badgesBefore - 1);
  });

  it('expands the Logistics section on click', async () => {
    const user = userEvent.setup();
    render(<Confirm profile={PROFILE} onConfirm={() => {}} />);
    expect(screen.queryByLabelText(/comp floor/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /logistics/i }));
    expect(screen.getByLabelText(/comp floor/i)).toBeInTheDocument();
  });

  it('disables the primary CTA when targetRole is empty', () => {
    render(<Confirm profile={EMPTY_PROFILE} onConfirm={() => {}} />);
    expect(screen.getByRole('button', { name: /start scanning/i })).toBeDisabled();
  });

  it('calls onConfirm with the current profile on Start scanning', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Confirm profile={PROFILE} onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: /start scanning/i }));
    expect(onConfirm).toHaveBeenCalledWith(PROFILE);
  });

  it('saves profile to localStorage when Save profile only is clicked', async () => {
    const user = userEvent.setup();
    const onSaveAndExit = vi.fn();
    render(<Confirm profile={PROFILE} onConfirm={() => {}} onSaveAndExit={onSaveAndExit} />);
    await user.click(screen.getByRole('button', { name: /save profile only/i }));
    expect(localStorage.getItem('trajector_profile')).toContain('Senior Backend Engineer');
    await waitFor(() => expect(onSaveAndExit).toHaveBeenCalled(), { timeout: 3000 });
  });
});
