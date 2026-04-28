import type { ResumeText, ResumeFileKind } from '../types';

function detectKind(file: File): ResumeFileKind {
  const name = file.name.toLowerCase();
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  ) {
    return 'docx';
  }
  if (file.type === 'text/markdown' || name.endsWith('.md') || name.endsWith('.markdown')) {
    return 'md';
  }
  throw new Error(`Unsupported file type: ${file.name} (${file.type})`);
}

function readFileBytes(file: File): Promise<ArrayBuffer> {
  // file.arrayBuffer() is not available in all environments (e.g. jsdom).
  // Fall back to FileReader which is universally supported.
  if (typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export async function parseResume(file: File): Promise<ResumeText> {
  const kind = detectKind(file);
  // Capture byteSize before reading — parsers (e.g. pdf.js) may transfer the
  // underlying ArrayBuffer, leaving bytes.byteLength === 0 afterwards.
  const byteSize = file.size;
  const buffer = await readFileBytes(file);
  const bytes = new Uint8Array(buffer);

  // Dynamic imports keep pdfjs-dist (~1MB) and mammoth (~200KB) out of the
  // initial bundle — they only load when a user actually drops a file.
  let text: string;
  if (kind === 'pdf') {
    const { parsePdf } = await import('./parsePdf');
    text = await parsePdf(bytes);
  } else if (kind === 'docx') {
    const { parseDocx } = await import('./parseDocx');
    text = await parseDocx(bytes);
  } else {
    text = new TextDecoder().decode(bytes);
  }

  return {
    kind,
    filename: file.name,
    text,
    byteSize,
  };
}
