import type { RawJob } from './types';

interface AshbyJob {
  id?: string;
  title?: string;
  department?: string;
  location?: string;
  applyUrl?: string;
  jobUrl?: string;
  descriptionPlain?: string;
  publishedAt?: string;
}

interface AshbyResponse {
  jobs?: AshbyJob[];
}

export async function fetchAshbyJobs(slug: string, companyName: string): Promise<RawJob[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${slug}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Ashby fetch failed for ${slug}: ${res.status}`);
  }
  const data = (await res.json()) as AshbyResponse;
  const jobs = Array.isArray(data.jobs) ? data.jobs : [];
  return jobs.map((j) => ({
    id: `ashby:${slug}:${j.id ?? ''}`,
    source: 'ashby' as const,
    company: companyName,
    title: typeof j.title === 'string' ? j.title : '',
    location: typeof j.location === 'string' && j.location ? j.location : 'Remote',
    description: typeof j.descriptionPlain === 'string' ? j.descriptionPlain : '',
    applyUrl: typeof j.applyUrl === 'string' ? j.applyUrl : (typeof j.jobUrl === 'string' ? j.jobUrl : ''),
    department: typeof j.department === 'string' && j.department ? j.department : null,
    updatedAt: typeof j.publishedAt === 'string' ? j.publishedAt : null,
  }));
}
