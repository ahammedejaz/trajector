import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Confirm } from './Confirm';
import type { Profile } from '../../types';

const SAMPLE: Profile = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  yearsOfExperience: null,
  stackSignals: ['Go', 'PostgreSQL'],
  employmentTypes: [],
  compFloor: 200000,
  locationPreference: 'remote',
  country: null,
  preferredLocations: [],
  requiresSponsorship: false,
  dealBreakers: [],
  companyStages: [],
  companySize: null,
  equityImportance: null,
  industriesToExclude: [],
  jobSearchStatus: null,
};

describe('Confirm screen', () => {
  it('renders the heading', () => {
    render(<Confirm profile={SAMPLE} onConfirm={() => {}} />);
    expect(screen.getByText('Confirm your profile')).toBeInTheDocument();
  });

  it('pre-fills the target role field', () => {
    render(<Confirm profile={SAMPLE} onConfirm={() => {}} />);
    expect(screen.getByDisplayValue('Senior Backend Engineer')).toBeInTheDocument();
  });

  it('renders stack signal chips', () => {
    render(<Confirm profile={SAMPLE} onConfirm={() => {}} />);
    expect(screen.getByText('Go')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
  });

  it('calls onConfirm with the current profile when Start scanning is clicked', async () => {
    const onConfirm = vi.fn();
    render(<Confirm profile={SAMPLE} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('button', { name: /start scanning/i }));
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({
      targetRole: 'Senior Backend Engineer',
      level: 'senior',
    }));
  });

  it('disables Start scanning when targetRole is empty', () => {
    render(<Confirm profile={{ ...SAMPLE, targetRole: '' }} onConfirm={() => {}} />);
    expect(screen.getByRole('button', { name: /start scanning/i })).toBeDisabled();
  });

  it('shows "Required." after blurring an empty targetRole', async () => {
    const user = userEvent.setup();
    render(<Confirm profile={{ ...SAMPLE, targetRole: '' }} onConfirm={() => {}} />);
    await user.click(screen.getByLabelText('Target role'));
    await user.tab();
    expect(screen.getByText('Required.')).toBeInTheDocument();
  });

  it('lets the user edit targetRole and calls onConfirm with updated value', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Confirm profile={SAMPLE} onConfirm={onConfirm} />);
    const input = screen.getByLabelText('Target role');
    await user.clear(input);
    await user.type(input, 'Staff Engineer');
    await user.click(screen.getByRole('button', { name: /start scanning/i }));
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ targetRole: 'Staff Engineer' }));
  });
});
