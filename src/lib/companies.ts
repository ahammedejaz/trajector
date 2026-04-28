export type AtsType = 'greenhouse' | 'ashby' | 'lever';

export interface Company {
  /** Display name shown in the UI. */
  name: string;
  /** Which ATS API to call. */
  ats: AtsType;
  /** The slug used in the API URL (e.g. "stripe" → boards-api.greenhouse.io/v1/boards/stripe/jobs). */
  slug: string;
  /** Short tagline for the company list. */
  tagline?: string;
}

/**
 * Curated companies. Each slug has been verified to return jobs from its public API.
 *
 * Greenhouse:  https://boards-api.greenhouse.io/v1/boards/{slug}/jobs
 * Ashby:       https://api.ashbyhq.com/posting-api/job-board/{slug}
 * Lever:       https://api.lever.co/v0/postings/{slug}
 *
 * Adding a company:
 *   1. Find their careers page. If hosted at boards.greenhouse.io/{slug}, use 'greenhouse'.
 *      If at jobs.ashbyhq.com/{slug}, use 'ashby'. If at jobs.lever.co/{slug}, use 'lever'.
 *   2. Verify the slug returns 200 with jobs:
 *      curl -s "https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=false" | head
 *   3. Add an entry below.
 */
export const COMPANIES: readonly Company[] = [
  // Greenhouse
  { name: 'Stripe', ats: 'greenhouse', slug: 'stripe', tagline: 'Payments infrastructure' },
  { name: 'Anthropic', ats: 'greenhouse', slug: 'anthropic', tagline: 'AI safety lab' },
  { name: 'Airbnb', ats: 'greenhouse', slug: 'airbnb', tagline: 'Travel marketplace' },
  { name: 'Datadog', ats: 'greenhouse', slug: 'datadog', tagline: 'Observability' },
  { name: 'Cloudflare', ats: 'greenhouse', slug: 'cloudflare', tagline: 'Edge infrastructure' },
  { name: 'Databricks', ats: 'greenhouse', slug: 'databricks', tagline: 'Data + AI platform' },
  { name: 'Figma', ats: 'greenhouse', slug: 'figma', tagline: 'Design tools' },
  { name: 'Coinbase', ats: 'greenhouse', slug: 'coinbase', tagline: 'Crypto exchange' },
  { name: 'Discord', ats: 'greenhouse', slug: 'discord', tagline: 'Community chat' },
  { name: 'Brex', ats: 'greenhouse', slug: 'brex', tagline: 'Corporate cards + finance' },
  { name: 'Robinhood', ats: 'greenhouse', slug: 'robinhood', tagline: 'Investing app' },
  { name: 'Pinterest', ats: 'greenhouse', slug: 'pinterest', tagline: 'Visual discovery' },
  { name: 'Reddit', ats: 'greenhouse', slug: 'reddit', tagline: 'Community platform' },

  // Ashby
  { name: 'OpenAI', ats: 'ashby', slug: 'openai', tagline: 'AI research' },
  { name: 'Linear', ats: 'ashby', slug: 'linear', tagline: 'Issue tracker' },
  { name: 'Notion', ats: 'ashby', slug: 'notion', tagline: 'Productivity OS' },
  { name: 'Ramp', ats: 'ashby', slug: 'ramp', tagline: 'Spend management' },
  { name: 'ElevenLabs', ats: 'ashby', slug: 'elevenlabs', tagline: 'AI voice synthesis' },
  { name: 'Cohere', ats: 'ashby', slug: 'cohere', tagline: 'Enterprise LLMs' },
  { name: 'Perplexity', ats: 'ashby', slug: 'perplexity', tagline: 'AI search' },
  { name: 'Supabase', ats: 'ashby', slug: 'supabase', tagline: 'Postgres backend' },
  { name: 'Modal', ats: 'ashby', slug: 'modal', tagline: 'Serverless compute for AI' },
  { name: 'Zip', ats: 'ashby', slug: 'zip', tagline: 'Procurement' },
  { name: 'Benchling', ats: 'ashby', slug: 'benchling', tagline: 'Biotech R&D platform' },
  { name: 'Deepgram', ats: 'ashby', slug: 'deepgram', tagline: 'Speech AI' },

  // Lever
  { name: 'Spotify', ats: 'lever', slug: 'spotify', tagline: 'Music streaming' },
  { name: 'Plaid', ats: 'lever', slug: 'plaid', tagline: 'Fintech infrastructure' },
  { name: 'Palantir', ats: 'lever', slug: 'palantir', tagline: 'Data integration' },
];

export const COMPANIES_BY_ATS: Record<AtsType, Company[]> = {
  greenhouse: COMPANIES.filter((c) => c.ats === 'greenhouse'),
  ashby: COMPANIES.filter((c) => c.ats === 'ashby'),
  lever: COMPANIES.filter((c) => c.ats === 'lever'),
};
