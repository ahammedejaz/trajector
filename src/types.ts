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
export type Screen = 'upload' | 'analyzing' | 'settings' | 'confirm' | 'stubScan';
