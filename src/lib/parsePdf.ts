import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

// Point to the worker file so the fake worker fallback can import it in tests.
// In the browser (Vite), this is overridden via URL import in the component layer.
pdfjs.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.mjs';

export async function parsePdf(data: Uint8Array): Promise<string> {
  const doc = await pdfjs.getDocument({ data, disableWorker: true }).promise;
  const parts: string[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const lines = content.items
      .filter((item): item is { str: string } => 'str' in item)
      .map((item) => item.str);
    parts.push(lines.join(' '));
  }
  return parts.join('\n\n');
}
