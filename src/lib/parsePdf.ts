import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

// In a real browser (Vite dev/prod), serve the worker from /public.
// In Vitest/jsdom, fall back to the Node-resolvable module path so the
// fake-worker shim can import it.
if (typeof window !== 'undefined' && !import.meta.env?.VITEST) {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
} else {
  pdfjs.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.mjs';
}

export async function parsePdf(data: Uint8Array): Promise<string> {
  const doc = await pdfjs.getDocument({ data }).promise;
  const parts: string[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const lines = content.items
      .filter((item) => 'str' in item)
      .map((item) => (item as { str: string }).str);
    parts.push(lines.join(' '));
  }
  return parts.join('\n\n');
}
