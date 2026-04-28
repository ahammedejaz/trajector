import type { Company, AtsType } from '../companies';
import type { RawJob } from './types';
import { fetchGreenhouseJobs } from './greenhouse';
import { fetchAshbyJobs } from './ashby';
import { fetchLeverJobs } from './lever';

export interface FetchError {
  company: string;
  ats: AtsType;
  error: string;
}

export interface FetchAllResult {
  jobs: RawJob[];
  stats: {
    requested: number;
    successful: number;
    failed: number;
    byAts: Record<AtsType, number>;
    errors: FetchError[];
  };
}

async function fetchOne(company: Company): Promise<RawJob[]> {
  switch (company.ats) {
    case 'greenhouse':
      return fetchGreenhouseJobs(company.slug, company.name);
    case 'ashby':
      return fetchAshbyJobs(company.slug, company.name);
    case 'lever':
      return fetchLeverJobs(company.slug, company.name);
  }
}

export async function fetchAllJobs(companies: readonly Company[]): Promise<FetchAllResult> {
  const requested = companies.length;
  const jobs: RawJob[] = [];
  const errors: FetchError[] = [];
  const byAts: Record<AtsType, number> = { greenhouse: 0, ashby: 0, lever: 0 };

  const settled = await Promise.allSettled(companies.map((c) => fetchOne(c)));

  settled.forEach((res, i) => {
    const company = companies[i];
    if (res.status === 'fulfilled') {
      jobs.push(...res.value);
      byAts[company.ats] += res.value.length;
    } else {
      errors.push({
        company: company.name,
        ats: company.ats,
        error: res.reason instanceof Error ? res.reason.message : String(res.reason),
      });
    }
  });

  return {
    jobs,
    stats: {
      requested,
      successful: requested - errors.length,
      failed: errors.length,
      byAts,
      errors,
    },
  };
}
