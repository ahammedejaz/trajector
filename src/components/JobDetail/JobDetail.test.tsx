import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JobDetail } from './JobDetail';
import type { ScoredJob } from '../../types';

const JOB: ScoredJob = {
  id: 'j1',
  source: 'linkedin',
  company: 'Acme',
  title: 'Senior Backend Engineer',
  location: 'Remote (US)',
  compRange: '$220k-$260k',
  description: 'Build Go services for scale.',
  tags: ['Go', 'Postgres'],
  score: 92,
  scoreReason: 'Stack matches.',
  applyUrl: 'https://example.com/apply',
  responsibilities: ['Design APIs', 'Own observability'],
  requirements: ['7+ years Go', 'Distributed systems'],
  benefits: ['401k match', 'Unlimited PTO'],
  experienceYears: '7+ years',
  companyBlurb: 'Acme builds boxes.',
};

describe('JobDetail', () => {
  it('renders the meta line with company, location, and comp', () => {
    render(<JobDetail job={JOB} />);
    expect(screen.getByText(/Acme · Remote \(US\) · \$220k-\$260k/)).toBeInTheDocument();
  });

  it('renders experience years when present', () => {
    render(<JobDetail job={JOB} />);
    expect(screen.getAllByText(/7\+ years/).length).toBeGreaterThan(0);
  });

  it('renders responsibilities, requirements, and benefits sections with their items', () => {
    render(<JobDetail job={JOB} />);
    expect(screen.getByRole('heading', { name: /responsibilities/i })).toBeInTheDocument();
    expect(screen.getByText('Design APIs')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /requirements/i })).toBeInTheDocument();
    expect(screen.getByText('7+ years Go')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /benefits/i })).toBeInTheDocument();
    expect(screen.getByText('401k match')).toBeInTheDocument();
  });

  it('renders the company blurb', () => {
    render(<JobDetail job={JOB} />);
    expect(screen.getByText(/Acme builds boxes/)).toBeInTheDocument();
  });

  it('renders an Apply link with target=_blank', () => {
    render(<JobDetail job={JOB} />);
    const link = screen.getByRole('link', { name: /apply on linkedin/i });
    expect(link).toHaveAttribute('href', 'https://example.com/apply');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

  it('renders the why-this-score section', () => {
    render(<JobDetail job={JOB} />);
    expect(screen.getByRole('heading', { name: /why this score/i })).toBeInTheDocument();
    expect(screen.getByText(/Stack matches/)).toBeInTheDocument();
  });

  it('omits empty arrays gracefully', () => {
    render(<JobDetail job={{ ...JOB, responsibilities: [], requirements: [], benefits: [] }} />);
    expect(screen.queryByRole('heading', { name: /responsibilities/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /requirements/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /benefits/i })).not.toBeInTheDocument();
  });

  it('omits company section when blurb is null', () => {
    render(<JobDetail job={{ ...JOB, companyBlurb: null }} />);
    expect(screen.queryByRole('heading', { name: /about the company/i })).not.toBeInTheDocument();
  });
});
