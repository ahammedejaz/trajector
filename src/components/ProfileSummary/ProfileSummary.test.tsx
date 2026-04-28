import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileSummary } from './ProfileSummary';
import type { Profile } from '../../types';

const PROFILE: Profile = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  yearsOfExperience: 7,
  stackSignals: ['Go', 'PostgreSQL', 'Kubernetes', 'gRPC', 'Redis'],
  employmentTypes: ['full-time'],
  compFloor: 200000,
  locationPreference: 'remote',
  country: 'United States',
  preferredLocations: [],
  requiresSponsorship: false,
  dealBreakers: [],
  companyStages: [],
  companySize: null,
  equityImportance: null,
  industriesToExclude: [],
  jobSearchStatus: null,
};

describe('ProfileSummary', () => {
  it('renders role, level, years, country', () => {
    render(<ProfileSummary profile={PROFILE} onEdit={() => {}} />);
    expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument();
    expect(screen.getByText(/senior · 7 yrs · United States/)).toBeInTheDocument();
  });

  it('renders the first 4 stack signals', () => {
    render(<ProfileSummary profile={PROFILE} onEdit={() => {}} />);
    expect(screen.getByText(/Go, PostgreSQL, Kubernetes, gRPC/)).toBeInTheDocument();
    expect(screen.queryByText(/Redis/)).not.toBeInTheDocument();
  });

  it('omits country segment when null', () => {
    render(<ProfileSummary profile={{ ...PROFILE, country: null }} onEdit={() => {}} />);
    expect(screen.getByText(/senior · 7 yrs/)).toBeInTheDocument();
    expect(screen.queryByText(/United States/)).not.toBeInTheDocument();
  });

  it('calls onEdit when Edit profile is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<ProfileSummary profile={PROFILE} onEdit={onEdit} />);
    await user.click(screen.getByRole('button', { name: /edit profile/i }));
    expect(onEdit).toHaveBeenCalled();
  });
});
