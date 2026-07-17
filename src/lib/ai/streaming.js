/**
 * Eduka — Streaming Provider
 * Suporte a streaming via ReadableStream para respostas em tempo real.
 * Providers: Groq, OpenCode, OpenRouter (todos free)
 */
import { getProviderConfig, getDefaultModelForProvider } from "./model-registry";

const API_TIMEOUT_MS = 60000;

export async function generateContentStream(prompt, options = {}) {
  const {
    provider: preferredProvider = "groq",
    model: preferredModel,
    system,
    temperature = 0.7,
    maxTokens = 8192,
  } = options;

  const config = getProviderConfig(preferredProvider);
  const model = preferredModel || getDefaultModelForProvider(preferredProvider);

  const apiKey = process.env[config.envKey];
  if (!apiKey) throw new Error(`${config.envKey} nao configurada`);

  const messages = [
    ...(system ? [{ role: "system", content: system }] : []),
    { role: "user", content: prompt },
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(config.baseUrl, {
      method: "POST",
      headers: config.headers(apiKey),
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`${config.name} error ${res.status}: ${errorText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta?.content;
                  if (delta) {
                    fullText += delta;
                    controller.enqueue(new TextEncoder().encode(`data: ${delta}\n\n`));
                  }
                } catch {
                  // Skip malformed chunks
                }
              }
            }
          }
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return { stream, fullText: () => fullText };
  } finally {
    clearTimeout(timeoutId);
  }
}
