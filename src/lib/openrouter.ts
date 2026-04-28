export interface ORMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ORCompletionOptions {
  /** Hard cap on output tokens. Default: model-defined (often too low for big JSON responses). */
  maxTokens?: number;
  /** When true, ask the model to return a JSON object. Supported by OpenAI/Anthropic via OpenRouter. */
  jsonResponse?: boolean;
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
  options: ORCompletionOptions = {},
): Promise<string> {
  const body: Record<string, unknown> = { model, messages };
  if (typeof options.maxTokens === 'number') {
    body.max_tokens = options.maxTokens;
  }
  if (options.jsonResponse) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/ahammedejaz/trajector',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}) as Record<string, unknown>) as {
      error?: { message?: string };
    };
    throw new OpenRouterError(errBody.error?.message ?? `HTTP ${res.status}`, res.status);
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>;
  };
  const content = data.choices[0]?.message?.content;
  if (content === undefined) throw new OpenRouterError('Empty response from model');
  return content;
}
