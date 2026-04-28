import type { Profile, ScoredJob } from '../types';

export const DEMO_PROFILE: Profile = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  yearsOfExperience: 7,
  stackSignals: ['Go', 'PostgreSQL', 'Kubernetes', 'gRPC'],
  employmentTypes: ['full-time'],
  compFloor: 200000,
  locationPreference: 'remote',
  country: 'United States',
  preferredLocations: [],
  requiresSponsorship: false,
  dealBreakers: ['On-call rotation'],
  companyStages: ['growth', 'public'],
  companySize: 'mid',
  equityImportance: 'nice',
  industriesToExclude: [],
  jobSearchStatus: 'open',
};

export const DEMO_JOBS: ScoredJob[] = [
  {
    id: 'demo-1',
    source: 'linkedin',
    company: 'Vercel',
    title: 'Staff Backend Engineer, Edge Runtime',
    location: 'Remote (US)',
    compRange: '$240k-$300k + equity',
    description:
      'Own the Edge Runtime that powers serverless functions at scale. Design and ship Go services handling millions of requests per second across our global network. You will collaborate with the platform team on observability, performance tuning, and zero-downtime rollouts.',
    tags: ['Go', 'Kubernetes', 'Postgres', 'Distributed Systems'],
    score: 94,
    scoreReason: 'Stack and seniority match; comp above floor; remote-first.',
  },
  {
    id: 'demo-2',
    source: 'greenhouse',
    company: 'Linear',
    title: 'Senior Backend Engineer',
    location: 'Remote (Americas)',
    compRange: '$220k-$260k + equity',
    description:
      'Build the backend that powers the Linear issue-tracker. We work in TypeScript on Node, Postgres, and Redis with a focus on snappy real-time sync. Looking for engineers comfortable shipping in small, autonomous teams.',
    tags: ['TypeScript', 'Postgres', 'Realtime'],
    score: 72,
    scoreReason: 'Different primary stack but seniority and comp align.',
  },
  {
    id: 'demo-3',
    source: 'lever',
    company: 'Cloudflare',
    title: 'Backend Engineer, Workers',
    location: 'Austin, TX (Hybrid)',
    compRange: '$180k-$220k',
    description:
      'Join the Workers team building the runtime that lets developers deploy code to 300+ edge locations. We work in Rust and Go.',
    tags: ['Go', 'Rust', 'Distributed Systems'],
    score: 65,
    scoreReason: 'Stack matches but hybrid in Austin and slightly below comp floor.',
  },
  {
    id: 'demo-4',
    source: 'workable',
    company: 'Acme Bank',
    title: 'Backend Developer',
    location: 'New York, NY (On-site, 5 days)',
    compRange: '$140k-$170k',
    description:
      'Maintain core banking platform written in Java. Five days on-site in midtown. On-call rotation. Strict deployment freezes during financial close.',
    tags: ['Java', 'Banking', 'On-site'],
    score: 28,
    scoreReason: 'On-call dealbreaker, on-site, comp below floor.',
  },
  {
    id: 'demo-5',
    source: 'yc',
    company: 'PinkPaperPlanes',
    title: 'Founding Engineer',
    location: 'San Francisco (On-site)',
    compRange: '$120k-$160k + 1.0% equity',
    description:
      'Build a paper-airplane-themed CRM for SMBs. Pre-seed; founder-led. Wear many hats. Office in SoMa.',
    tags: ['Founding', 'Equity', 'Generalist'],
    score: 42,
    scoreReason: 'Very early stage and on-site; equity-heavy comp below floor.',
  },
];
