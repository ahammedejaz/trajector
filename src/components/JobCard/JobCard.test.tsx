import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JobCard } from './JobCard';
import type { ScoredJob } from '../../types';

const JOB: ScoredJob = {
  id: 'j1',
  source: 'greenhouse',
  company: 'Acme Corp',
  title: 'Senior Backend Engineer',
  location: 'Remote (US)',
  compRange: '$220k-$260k',
  description: 'Build scalable Go services.',
  tags: ['Go', 'Postgres', 'Kubernetes'],
  score: 92,
  scoreReason: 'Stack matches.',
  applyUrl: '',
  responsibilities: [],
  requirements: [],
  benefits: [],
  experienceYears: null,
  companyBlurb: null,
};

describe('JobCard', () => {
  it('renders title, company, location, comp, and tags', () => {
    render(<JobCard job={JOB} onClick={() => {}} />);
    expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument();
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    expect(screen.getByText(/Remote \(US\)/)).toBeInTheDocument();
    expect(screen.getByText(/\$220k-\$260k/)).toBeInTheDocument();
    expect(screen.getByText('Go')).toBeInTheDocument();
    expect(screen.getByText('Postgres')).toBeInTheDocument();
  });

  it('renders the score', () => {
    render(<JobCard job={JOB} onClick={() => {}} />);
    expect(screen.getByText('92')).toBeInTheDocument();
  });

  it('omits comp when null', () => {
    render(<JobCard job={{ ...JOB, compRange: null }} onClick={() => {}} />);
    expect(screen.queryByText(/\$220k/)).not.toBeInTheDocument();
  });

  it('calls onClick when activated', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<JobCard job={JOB} onClick={onClick} />);
    await user.click(screen.getByRole('button', { name: /Senior Backend Engineer/i }));
    expect(onClick).toHaveBeenCalledWith(JOB);
  });
});
