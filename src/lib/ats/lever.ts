import type { RawJob } from './types';

interface LeverJob {
  id?: string;
  text?: string;
  categories?: {
    department?: string;
    location?: string;
    team?: string;
    commitment?: string;
  };
  descriptionPlain?: string;
  createdAt?: number;
  hostedUrl?: string;
  applyUrl?: string;
}

export async function fetchLeverJobs(slug: string, companyName: string): Promise<RawJob[]> {
  const url = `https://api.lever.co/v0/postings/${slug}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Lever fetch failed for ${slug}: ${res.status}`);
  }
  const data = (await res.json()) as unknown;
  const jobs: LeverJob[] = Array.isArray(data) ? (data as LeverJob[]) : [];
  return jobs.map((j) => ({
    id: `lever:${slug}:${j.id ?? ''}`,
    source: 'lever' as const,
    company: companyName,
    title: typeof j.text === 'string' ? j.text : '',
    location:
      typeof j.categories?.location === 'string' && j.categories.location
        ? j.categories.location
        : 'Remote',
    description: typeof j.descriptionPlain === 'string' ? j.descriptionPlain : '',
    applyUrl:
      typeof j.applyUrl === 'string' && j.applyUrl
        ? j.applyUrl
        : typeof j.hostedUrl === 'string'
          ? j.hostedUrl
          : '',
    department:
      typeof j.categories?.department === 'string' && j.categories.department
        ? j.categories.department
        : null,
    updatedAt: typeof j.createdAt === 'number' ? new Date(j.createdAt).toISOString() : null,
  }));
}
