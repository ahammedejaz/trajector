import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { parsePdf } from './parsePdf';

describe('parsePdf', () => {
  it('extracts text from a simple PDF', async () => {
    const buffer = await readFile('tests/fixtures/sample-resume.pdf');
    const text = await parsePdf(new Uint8Array(buffer));
    expect(text).toContain('Senior Backend Engineer at Anthropic');
    expect(text).toContain('Jane Doe');
  });

  it('rejects a zero-byte buffer', async () => {
    await expect(parsePdf(new Uint8Array(0))).rejects.toThrow();
  });
});
