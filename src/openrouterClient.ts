import { ExplanationRequest, ExplanationResult } from './types';
import { buildSystemPrompt, buildUserPrompt } from './promptBuilder';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterChoice {
  message: { content: string };
}

interface OpenRouterResponse {
  choices: OpenRouterChoice[];
  error?: { message: string };
}

export async function getExplanationFromOpenRouter(
  apiKey: string,
  model: string,
  request: ExplanationRequest
): Promise<ExplanationResult> {
  const systemPrompt = buildSystemPrompt(request.mode, request.responseLanguage);
  const userPrompt = buildUserPrompt(request);

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/adnanmalkani/cognitive-code-companion',
      'X-Title': 'Cognitive Code Companion',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as OpenRouterResponse;

  if (data.error) {
    throw new Error(`OpenRouter error: ${data.error.message}`);
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('No text response received from OpenRouter.');
  }

  return {
    explanation: text,
    mode: request.mode,
  };
}
