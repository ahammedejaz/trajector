export interface ORMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

export async function fetchCompletion(
  apiKey: string,
  model: string,
  messages: ORMessage[],
): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/ahammedejaz/trajector',
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as Record<string, unknown>) as {
      error?: { message?: string };
    };
    throw new OpenRouterError(body.error?.message ?? `HTTP ${res.status}`, res.status);
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>;
  };
  const content = data.choices[0]?.message?.content;
  if (content === undefined) throw new OpenRouterError('Empty response from model');
  return content;
}
