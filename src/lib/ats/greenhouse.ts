import type { RawJob } from './types';

interface GreenhouseJob {
  id: number | string;
  title?: string;
  absolute_url?: string;
  location?: { name?: string };
  departments?: Array<{ name?: string }>;
  content?: string;
  updated_at?: string;
}

interface GreenhouseResponse {
  jobs?: GreenhouseJob[];
}

/**
 * Decode the small set of HTML entities that show up in Greenhouse content.
 * We intentionally do NOT use DOMParser here — keeps the function pure and SSR-safe.
 */
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/**
 * Strip HTML tags from a string, preserving line breaks where block tags appeared.
 * Greenhouse returns HTML in the `content` field. We render it as plain text so the LLM
 * scoring prompt isn't bloated with markup.
 */
function htmlToPlain(html: string): string {
  if (!html) return '';
  return decodeEntities(
    html
      .replace(/<\/(p|div|li|h[1-6]|br)>/gi, '\n')
      .replace(/<br\s*\/?>(\s*\n)?/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
  );
}

export async function fetchGreenhouseJobs(slug: string, companyName: string): Promise<RawJob[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Greenhouse fetch failed for ${slug}: ${res.status}`);
  }
  const data = (await res.json()) as GreenhouseResponse;
  const jobs = Array.isArray(data.jobs) ? data.jobs : [];
  return jobs.map((j) => ({
    id: `greenhouse:${slug}:${j.id}`,
    source: 'greenhouse' as const,
    company: companyName,
    title: typeof j.title === 'string' ? j.title : '',
    location: typeof j.location?.name === 'string' && j.location.name ? j.location.name : 'Remote',
    description: htmlToPlain(j.content ?? ''),
    applyUrl: typeof j.absolute_url === 'string' ? j.absolute_url : '',
    department:
      Array.isArray(j.departments) && j.departments[0]?.name
        ? j.departments[0].name
        : null,
    updatedAt: typeof j.updated_at === 'string' ? j.updated_at : null,
  }));
}
