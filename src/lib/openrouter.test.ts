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

  it('omits max_tokens and response_format when no options provided', async () => {
    const spy = makeFetch(true, 200, { choices: [{ message: { content: 'ok' } }] });
    vi.stubGlobal('fetch', spy);
    await fetchCompletion('k', 'm', [{ role: 'user', content: 'hi' }]);
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body).not.toHaveProperty('max_tokens');
    expect(body).not.toHaveProperty('response_format');
  });

  it('passes max_tokens through when provided', async () => {
    const spy = makeFetch(true, 200, { choices: [{ message: { content: 'ok' } }] });
    vi.stubGlobal('fetch', spy);
    await fetchCompletion('k', 'm', [{ role: 'user', content: 'hi' }], { maxTokens: 4096 });
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.max_tokens).toBe(4096);
  });

  it('sets response_format to json_object when jsonResponse is true', async () => {
    const spy = makeFetch(true, 200, { choices: [{ message: { content: '{}' } }] });
    vi.stubGlobal('fetch', spy);
    await fetchCompletion('k', 'm', [{ role: 'user', content: 'hi' }], { jsonResponse: true });
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as { response_format?: { type: string } };
    expect(body.response_format).toEqual({ type: 'json_object' });
  });
});
