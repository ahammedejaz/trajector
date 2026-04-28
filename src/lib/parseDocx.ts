import mammoth from 'mammoth';

export async function parseDocx(buffer: Uint8Array | ArrayBuffer): Promise<string> {
  const buf = buffer instanceof ArrayBuffer
    ? Buffer.from(buffer)
    : Buffer.from(buffer);
  const result = await mammoth.extractRawText({ buffer: buf });
  return result.value;
}
