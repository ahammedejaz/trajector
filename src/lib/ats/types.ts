import type { AtsType } from '../companies';

/** Normalized job from any ATS, before LLM scoring. */
export interface RawJob {
  /** Stable per-job ID, prefixed with ATS source for global uniqueness. */
  id: string;
  /** Which ATS this came from. */
  source: AtsType;
  /** Display name of the company (from companies.ts). */
  company: string;
  /** Job title. */
  title: string;
  /** Human-readable location, e.g. "Remote (US)" or "San Francisco, CA". */
  location: string;
  /** Plain-text job description (HTML stripped if needed). May be long. */
  description: string;
  /** Apply URL (real, fetched from API). */
  applyUrl: string;
  /** Optional department / team — used to enrich tags. */
  department: string | null;
  /** ISO timestamp of last update (for sort/freshness). */
  updatedAt: string | null;
}
