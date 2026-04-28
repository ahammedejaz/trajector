export type ResumeFileKind = 'pdf' | 'docx' | 'md';
export interface ResumeText {
  kind: ResumeFileKind;
  filename: string;
  text: string;
  byteSize: number;
}
export type Level = 'junior' | 'mid' | 'senior' | 'staff' | 'principal';
export type LocationPref = 'remote' | 'hybrid' | 'onsite' | 'flexible';
export type EmploymentType = 'full-time' | 'contract' | 'part-time';
export type CompanyStage = 'seed' | 'early' | 'growth' | 'public';
export type CompanySize = 'startup' | 'mid' | 'large' | 'enterprise';
export type EquityImportance = 'dealbreaker' | 'important' | 'nice' | 'irrelevant';
export type JobSearchStatus = 'active' | 'open' | 'passive';
export interface Profile {
  // Essentials
  targetRole: string;
  level: Level;
  yearsOfExperience: number | null;
  stackSignals: string[];
  employmentTypes: EmploymentType[];
  // Logistics
  compFloor: number | null;
  locationPreference: LocationPref;
  country: string | null;
  preferredLocations: string[];
  requiresSponsorship: boolean;
  dealBreakers: string[];
  // Preferences
  companyStages: CompanyStage[];
  companySize: CompanySize | null;
  equityImportance: EquityImportance | null;
  industriesToExclude: string[];
  jobSearchStatus: JobSearchStatus | null;
}
export interface AppSettings {
  openRouterKey: string;
  model: string;
  sources: {
    linkedin: boolean;
    greenhouse: boolean;
    lever: boolean;
    workable: boolean;
    yc: boolean;
  };
}
export type SourceKey = keyof AppSettings['sources'];
export type ScoreTier = 'strong' | 'decent' | 'skip';
export interface ScoredJob {
  id: string;
  source: SourceKey;
  company: string;
  title: string;
  location: string;
  compRange: string | null;
  description: string;
  tags: string[];
  score: number;
  scoreReason: string;
  // NEW
  applyUrl: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  experienceYears: string | null;  // e.g. "5+ years"
  companyBlurb: string | null;     // 1-2 sentences about the company
}
export type SourceStatus = 'queued' | 'scanning' | 'done' | 'error';
export interface SourceState {
  key: SourceKey;
  label: string;
  status: SourceStatus;
}
export interface ScanProgress {
  sources: SourceState[];
  jobs: ScoredJob[];
  error: string | null;
  finished: boolean;
}
export type Screen = 'landing' | 'upload' | 'analyzing' | 'settings' | 'confirm' | 'results';
