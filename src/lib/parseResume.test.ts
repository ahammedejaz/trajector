import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { parseResume } from './parseResume';

function fileFromBuffer(buf: Uint8Array, name: string, type: string): File {
  return new File([buf], name, { type });
}

describe('parseResume', () => {
  it('parses a PDF File', async () => {
    const bytes = await readFile('tests/fixtures/sample-resume.pdf');
    const file = fileFromBuffer(new Uint8Array(bytes), 'resume.pdf', 'application/pdf');
    const result = await parseResume(file);
    expect(result.kind).toBe('pdf');
    expect(result.filename).toBe('resume.pdf');
    expect(result.text).toContain('Senior Backend Engineer at Anthropic');
    expect(result.byteSize).toBe(bytes.length);
  });

  it('parses a DOCX File', async () => {
    const bytes = await readFile('tests/fixtures/sample-resume.docx');
    const file = fileFromBuffer(
      new Uint8Array(bytes),
      'resume.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    const result = await parseResume(file);
    expect(result.kind).toBe('docx');
    expect(result.text).toContain('Senior Backend Engineer at Anthropic');
  });

  it('parses a markdown File', async () => {
    const md = '# Jane Doe\n\nSenior Backend Engineer at Anthropic';
    const file = fileFromBuffer(new TextEncoder().encode(md), 'resume.md', 'text/markdown');
    const result = await parseResume(file);
    expect(result.kind).toBe('md');
    expect(result.text).toContain('Senior Backend Engineer at Anthropic');
  });

  it('rejects unsupported file types', async () => {
    const file = fileFromBuffer(new Uint8Array([1, 2, 3]), 'resume.png', 'image/png');
    await expect(parseResume(file)).rejects.toThrow(/unsupported/i);
  });
});
