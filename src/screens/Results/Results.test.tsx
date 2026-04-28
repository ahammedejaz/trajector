import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Results } from './Results';
import type { Profile, ScoredJob } from '../../types';

const PROFILE: Profile = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  yearsOfExperience: 7,
  stackSignals: ['Go'],
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

const JOBS: ScoredJob[] = [
  { id: 'j1', source: 'greenhouse', company: 'Acme', title: 'Senior Backend Engineer', location: 'Remote', compRange: '$220k', description: 'Build Go services for scale.', tags: ['Go'], score: 92, scoreReason: 'Match.', applyUrl: '', responsibilities: [], requirements: [], benefits: [], experienceYears: null, companyBlurb: null },
  { id: 'j2', source: 'greenhouse', company: 'Beta', title: 'Backend Engineer', location: 'Remote', compRange: null, description: 'Ship features.', tags: ['Go'], score: 65, scoreReason: 'Decent.', applyUrl: '', responsibilities: [], requirements: [], benefits: [], experienceYears: null, companyBlurb: null },
  { id: 'j3', source: 'lever', company: 'Gamma', title: 'Junior Backend', location: 'Remote', compRange: null, description: 'Junior.', tags: ['Go'], score: 30, scoreReason: 'Too junior.', applyUrl: '', responsibilities: [], requirements: [], benefits: [], experienceYears: null, companyBlurb: null },
];

vi.mock('../../lib/scanJobs', () => ({
  scanJobs: vi.fn(),
  SOURCE_LABELS: {
    greenhouse: 'Greenhouse',
    ashby: 'Ashby',
    lever: 'Lever',
  },
}));

vi.mock('../../lib/storage', () => ({
  loadSettings: () => ({
    openRouterKey: 'sk-or-test',
    model: 'anthropic/claude-sonnet-4-6',
    sources: { greenhouse: true, ashby: true, lever: true },
  }),
}));

import { scanJobs } from '../../lib/scanJobs';

const NOOP_PROPS = {
  onEditProfile: () => {},
  onSwitchResume: () => {},
  onOpenSettings: () => {},
};

describe('Results screen — sidebar layout', () => {
  beforeEach(() => {
    vi.mocked(scanJobs).mockResolvedValue(JOBS);
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders sidebar with profile summary', async () => {
    render(<Results profile={PROFILE} {...NOOP_PROPS} />);
    await waitFor(() => expect(screen.getByText(/strong matches/i)).toBeInTheDocument());
    expect(screen.getAllByText('Senior Backend Engineer').length).toBeGreaterThan(0);
    expect(screen.getByText(/senior · 7 yrs · United States/)).toBeInTheDocument();
  });

  it('renders strong + decent matches and skipped count by default', async () => {
    render(<Results profile={PROFILE} {...NOOP_PROPS} />);
    await waitFor(() => expect(screen.getByText(/strong matches/i)).toBeInTheDocument());
    expect(screen.getByText(/decent matches/i)).toBeInTheDocument();
    expect(screen.getByText(/1 skipped/i)).toBeInTheDocument();
  });

  it('filters by tier — selecting Strong hides decent matches', async () => {
    const user = userEvent.setup();
    render(<Results profile={PROFILE} {...NOOP_PROPS} />);
    await waitFor(() => expect(screen.getByText(/strong matches/i)).toBeInTheDocument());
    await user.click(screen.getByRole('radio', { name: 'Strong' }));
    expect(screen.queryByText(/decent matches/i)).not.toBeInTheDocument();
    expect(screen.getByText(/strong matches/i)).toBeInTheDocument();
  });

  it('filters by source — unchecking Greenhouse hides Beta', async () => {
    const user = userEvent.setup();
    render(<Results profile={PROFILE} {...NOOP_PROPS} />);
    await waitFor(() => expect(screen.getByText(/strong matches/i)).toBeInTheDocument());
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Greenhouse' }));
    expect(screen.queryByText('Backend Engineer')).not.toBeInTheDocument();
    expect(screen.getAllByText('Senior Backend Engineer').length).toBeGreaterThan(0);
  });

  it('filters by min score — slider at 70 cuts the 65 job', async () => {
    render(<Results profile={PROFILE} {...NOOP_PROPS} />);
    await waitFor(() => expect(screen.getByText(/strong matches/i)).toBeInTheDocument());
    fireEvent.change(screen.getByRole('slider', { name: /min score/i }), { target: { value: '70' } });
    expect(screen.queryByText('Backend Engineer')).not.toBeInTheDocument();
    expect(screen.getAllByText('Senior Backend Engineer').length).toBeGreaterThan(0);
  });

  it('triggers onSwitchResume from sidebar New scan button', async () => {
    const user = userEvent.setup();
    const onSwitchResume = vi.fn();
    render(<Results profile={PROFILE} {...NOOP_PROPS} onSwitchResume={onSwitchResume} />);
    await waitFor(() => expect(screen.getByText(/strong matches/i)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /new scan/i }));
    expect(onSwitchResume).toHaveBeenCalled();
  });

  it('triggers onEditProfile from sidebar Edit profile link', async () => {
    const user = userEvent.setup();
    const onEditProfile = vi.fn();
    render(<Results profile={PROFILE} {...NOOP_PROPS} onEditProfile={onEditProfile} />);
    await waitFor(() => expect(screen.getByText(/strong matches/i)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /edit profile/i }));
    expect(onEditProfile).toHaveBeenCalled();
  });

  it('triggers onOpenSettings from sidebar Settings link', async () => {
    const user = userEvent.setup();
    const onOpenSettings = vi.fn();
    render(<Results profile={PROFILE} {...NOOP_PROPS} onOpenSettings={onOpenSettings} />);
    await waitFor(() => expect(screen.getByText(/strong matches/i)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /^settings$/i }));
    expect(onOpenSettings).toHaveBeenCalled();
  });

  it('shows error message when scan fails', async () => {
    vi.mocked(scanJobs).mockRejectedValueOnce(new Error('API down'));
    render(<Results profile={PROFILE} {...NOOP_PROPS} />);
    await waitFor(() => expect(screen.getByText(/scan failed/i)).toBeInTheDocument());
    expect(screen.getByText(/API down/)).toBeInTheDocument();
  });
});
