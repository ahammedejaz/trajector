import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { parseDocx } from './parseDocx';

describe('parseDocx', () => {
  it('extracts text from a simple DOCX', async () => {
    const buffer = await readFile('tests/fixtures/sample-resume.docx');
    const text = await parseDocx(buffer);
    expect(text).toContain('Senior Backend Engineer at Anthropic');
    expect(text).toContain('Jane Doe');
  });
});
