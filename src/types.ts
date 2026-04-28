export type ResumeFileKind = 'pdf' | 'docx' | 'md';
export interface ResumeText {
  kind: ResumeFileKind;
  filename: string;
  text: string;
  byteSize: number;
}
export type Level = 'junior' | 'mid' | 'senior' | 'staff' | 'principal';
export type LocationPref = 'remote' | 'hybrid' | 'onsite';
export interface Profile {
  targetRole: string;
  level: Level;
  compFloor: number | null;
  location: LocationPref;
  stackSignals: string[];
  dealBreakers: string[];
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
export type Screen = 'upload' | 'analyzing' | 'settings' | 'confirm' | 'results';
