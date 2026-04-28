export type ResumeFileKind = 'pdf' | 'docx' | 'md';

export interface ResumeText {
  kind: ResumeFileKind;
  filename: string;
  text: string;
  byteSize: number;
}

export type Screen = 'upload' | 'stubResult';
