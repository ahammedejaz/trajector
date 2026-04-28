import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Results } from './Results';
import type { Profile, ScoredJob } from '../../types';

const PROFILE: Profile = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  compFloor: 200000,
  location: 'remote',
  stackSignals: ['Go'],
  dealBreakers: [],
};

const JOBS: ScoredJob[] = [
  { id: 'j1', source: 'linkedin', company: 'Acme', title: 'Senior Backend Engineer', location: 'Remote', compRange: '$220k', description: 'Build Go services for scale.', tags: ['Go'], score: 92, scoreReason: 'Match.' },
  { id: 'j2', source: 'greenhouse', company: 'Beta', title: 'Backend Engineer', location: 'Remote', compRange: null, description: 'Ship features.', tags: ['Go'], score: 65, scoreReason: 'Decent.' },
  { id: 'j3', source: 'lever', company: 'Gamma', title: 'Junior Backend', location: 'Remote', compRange: null, description: 'Junior.', tags: ['Go'], score: 30, scoreReason: 'Too junior.' },
];

vi.mock('../../lib/scanJobs', () => ({
  scanJobs: vi.fn(),
  SOURCE_LABELS: {
    linkedin: 'LinkedIn',
    greenhouse: 'Greenhouse',
    lever: 'Lever',
    workable: 'Workable',
    yc: 'Y Combinator',
  },
}));

vi.mock('../../lib/storage', () => ({
  loadSettings: () => ({
    openRouterKey: 'sk-or-test',
    model: 'anthropic/claude-sonnet-4-6',
    sources: { linkedin: true, greenhouse: true, lever: true, workable: false, yc: false },
  }),
}));

import { scanJobs } from '../../lib/scanJobs';

describe('Results screen', () => {
  beforeEach(() => {
    vi.mocked(scanJobs).mockResolvedValue(JOBS);
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows scanning state on mount', () => {
    render(
      <Results
        profile={PROFILE}
        onEditProfile={() => {}}
        onSwitchResume={() => {}}
        onOpenSettings={() => {}}
      />,
    );
    expect(screen.getAllByText(/scanning/i).length).toBeGreaterThan(0);
  });

  it('renders strong and decent matches grouped after scan finishes', async () => {
    render(
      <Results
        profile={PROFILE}
        onEditProfile={() => {}}
        onSwitchResume={() => {}}
        onOpenSettings={() => {}}
      />,
    );
    await waitFor(() => expect(screen.getByText(/strong matches/i)).toBeInTheDocument());
    expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument();
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
    expect(screen.getByText(/decent matches/i)).toBeInTheDocument();
  });

  it('shows skipped count instead of skip cards', async () => {
    render(
      <Results
        profile={PROFILE}
        onEditProfile={() => {}}
        onSwitchResume={() => {}}
        onOpenSettings={() => {}}
      />,
    );
    await waitFor(() => expect(screen.getByText(/1 skipped/i)).toBeInTheDocument());
    expect(screen.queryByText('Junior Backend')).not.toBeInTheDocument();
  });

  it('opens side sheet when a job card is clicked', async () => {
    const user = userEvent.setup();
    render(
      <Results
        profile={PROFILE}
        onEditProfile={() => {}}
        onSwitchResume={() => {}}
        onOpenSettings={() => {}}
      />,
    );
    await waitFor(() => expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Senior Backend Engineer at Acme/i }));
    expect(screen.getByText('Build Go services for scale.')).toBeInTheDocument();
    expect(screen.getByText(/why this score/i)).toBeInTheDocument();
  });

  it('shows error message when scan fails', async () => {
    vi.mocked(scanJobs).mockRejectedValueOnce(new Error('API down'));
    render(
      <Results
        profile={PROFILE}
        onEditProfile={() => {}}
        onSwitchResume={() => {}}
        onOpenSettings={() => {}}
      />,
    );
    await waitFor(() => expect(screen.getByText(/scan failed/i)).toBeInTheDocument());
    expect(screen.getByText(/API down/)).toBeInTheDocument();
  });

  it('triggers onEditProfile via profile menu', async () => {
    const user = userEvent.setup();
    const onEditProfile = vi.fn();
    render(
      <Results
        profile={PROFILE}
        onEditProfile={onEditProfile}
        onSwitchResume={() => {}}
        onOpenSettings={() => {}}
      />,
    );
    await user.click(screen.getByRole('button', { name: /profile menu/i }));
    await user.click(screen.getByRole('menuitem', { name: /edit profile/i }));
    expect(onEditProfile).toHaveBeenCalled();
  });
});
