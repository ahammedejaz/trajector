import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchCompletion, OpenRouterError } from './openrouter';

afterEach(() => { vi.unstubAllGlobals(); });

function makeFetch(ok: boolean, status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok, status,
    json: () => Promise.resolve(body),
  });
}

describe('fetchCompletion', () => {
  it('returns the assistant message content on success', async () => {
    vi.stubGlobal('fetch', makeFetch(true, 200, { choices: [{ message: { content: 'hello world' } }] }));
    const result = await fetchCompletion('sk-key', 'model-x', [{ role: 'user', content: 'hi' }]);
    expect(result).toBe('hello world');
  });

  it('sends Authorization header with Bearer token', async () => {
    const spy = makeFetch(true, 200, { choices: [{ message: { content: 'ok' } }] });
    vi.stubGlobal('fetch', spy);
    await fetchCompletion('sk-test', 'model-x', [{ role: 'user', content: 'hi' }]);
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer sk-test');
  });

  it('throws OpenRouterError with message on 401', async () => {
    vi.stubGlobal('fetch', makeFetch(false, 401, { error: { message: 'Invalid API key' } }));
    await expect(fetchCompletion('bad-key', 'model-x', [{ role: 'user', content: 'hi' }])).rejects.toThrow('Invalid API key');
  });

  it('throws OpenRouterError with HTTP status fallback on unknown error shape', async () => {
    vi.stubGlobal('fetch', makeFetch(false, 500, {}));
    await expect(fetchCompletion('key', 'model', [{ role: 'user', content: 'hi' }])).rejects.toThrow('HTTP 500');
  });

  it('throws OpenRouterError when choices array is empty', async () => {
    vi.stubGlobal('fetch', makeFetch(true, 200, { choices: [] }));
    await expect(fetchCompletion('key', 'model', [{ role: 'user', content: 'hi' }])).rejects.toThrow(OpenRouterError);
  });
});
