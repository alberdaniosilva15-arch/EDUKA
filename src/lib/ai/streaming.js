/**
 * Eduka — Streaming Provider
 * Suporte a streaming via ReadableStream para respostas em tempo real.
 *
 * NOTA: Streaming não suporta retry/fallback automático como generateContent.
 * Se o provider falhar antes de iniciar o stream, o erro é propagado.
 * O frontend deve usar o provider não-streaming como fallback.
 */
import { PROVIDERS, getProviderConfig, resolveModel, getDefaultModelForProvider } from "./model-registry";

const API_TIMEOUT_MS = 60000;

/**
 * Gera conteúdo com streaming via ReadableStream.
 * Retorna um ReadableStream que o cliente pode consumir.
 */
export async function generateContentStream(prompt, options = {}) {
  const {
    provider: preferredProvider = "openrouter",
    model: preferredModel,
    system,
    temperature = 0.7,
    maxTokens = 8192,
  } = options;

  const config = getProviderConfig(preferredProvider);
  const model = preferredModel || getDefaultModelForProvider(preferredProvider);

  if (preferredProvider === "gemini") {
    return streamGemini(model, prompt, options);
  }

  // OpenAI-compatible providers (OpenRouter, Groq, NVIDIA)
  const apiKey = process.env[config.envKey];
  if (!apiKey) throw new Error(`${config.envKey} não configurada`);

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

    // Converter NDJSON stream para texto simples
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
                    // Formatar como SSE: data: <delta>\n\n
                    controller.enqueue(new TextEncoder().encode(`data: ${delta}\n\n`));
                  }
                } catch {
                  // Skip malformed chunks
                }
              }
            }
          }
          // Enviar evento de conclusão
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    // Retornar stream e texto completo (para logging)
    return { stream, fullText: () => fullText };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Streaming via Gemini (usa chunking manual já que Gemini não suporta SSE nativo).
 */
async function streamGemini(model, prompt, options) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada");

  const config = PROVIDERS.gemini;
  const effectiveModel = config.allowlist?.includes(model) ? model : config.defaultModel;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 8192,
        topP: 0.95,
      },
    };

    if (options.system) {
      body.systemInstruction = { parts: [{ text: options.system }] };
    }

    const res = await fetch(`${config.baseUrl}/${effectiveModel}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini error ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    const fullText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Gemini não suporta streaming real — simular chunking com SSE
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const chunkSize = 50;
        for (let i = 0; i < fullText.length; i += chunkSize) {
          const chunk = fullText.slice(i, i + chunkSize);
          controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return { stream, fullText: () => fullText };
  } finally {
    clearTimeout(timeoutId);
  }
}
