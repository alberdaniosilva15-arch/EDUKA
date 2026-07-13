/**
 * Eduka — Provider Router
 * Retry, backoff, circuit breaker e metadados de quem realmente respondeu.
 */
import {
  PROVIDERS,
  getProviderConfig,
  getFallbackChain,
  resolveModel,
  getDefaultModelForProvider,
} from "./model-registry";

const API_TIMEOUT_MS = 45000;
const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 1000;

// ─── Circuit breaker (in-memory por cold start) ────────────

const circuitState = new Map(); // key: "provider:model" → { failures, openUntil }

function getCircuitKey(provider, model) {
  return `${provider}:${model}`;
}

function isCircuitOpen(key) {
  const state = circuitState.get(key);
  if (!state) return false;
  if (Date.now() > state.openUntil) {
    circuitState.delete(key);
    return false;
  }
  return true;
}

function recordFailure(key) {
  const state = circuitState.get(key) || { failures: 0, openUntil: 0 };
  state.failures++;
  if (state.failures >= 3) {
    state.openUntil = Date.now() + 60_000; // aberto por 60s
  }
  circuitState.set(key, state);
}

function recordSuccess(key) {
  circuitState.delete(key);
}

// ─── Transient error detection ─────────────────────────────

function isTransient(status) {
  return [429, 500, 502, 503, 504].includes(status);
}

function isFatal(status) {
  return [400, 401, 403, 404].includes(status);
}

function getRetryAfter(res) {
  const retryAfter = res.headers?.get?.("Retry-After");
  if (retryAfter) {
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) return seconds * 1000;
  }
  return null;
}

// ─── Provider callers ──────────────────────────────────────

async function callOpenAICompatible(providerConfig, model, prompt, options) {
  const apiKey = process.env[providerConfig.envKey];
  if (!apiKey) throw new Error(`${providerConfig.envKey} nao configurada`);

  const messages = [
    ...(options.system ? [{ role: "system", content: options.system }] : []),
    { role: "user", content: prompt },
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(providerConfig.baseUrl, {
      method: "POST",
      headers: providerConfig.headers(apiKey),
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 8192,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      const err = new Error(`${providerConfig.name} error ${res.status}: ${errorText}`);
      err.status = res.status;
      err.retryAfter = getRetryAfter(res);
      throw err;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callGemini(model, prompt, options) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY nao configurada");

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
      headers: config.headers(),
      signal: controller.signal,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      const err = new Error(`Gemini error ${res.status}: ${errorText}`);
      err.status = res.status;
      err.retryAfter = getRetryAfter(res);
      throw err;
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callProvider(providerId, model, prompt, options) {
  const config = getProviderConfig(providerId);

  if (providerId === "gemini") {
    return callGemini(model, prompt, options);
  }

  return callOpenAICompatible(config, model, prompt, options);
}

// ─── Main entry point ──────────────────────────────────────

/**
 * Gera conteudo com retry, backoff, circuit breaker e fallback entre providers.
 * Retorna { text, provider, model, attempts, latencyMs }.
 */
export async function generateContent(prompt, options = {}) {
  const {
    provider: preferredProvider = "openrouter",
    model: preferredModel,
    capability = "text",
    system,
    temperature = 0.7,
    maxTokens = 8192,
  } = options;

  const chain = getFallbackChain(preferredProvider, capability);
  const startModel = preferredModel || getDefaultModelForProvider(preferredProvider);

  // Se o modelo preferido e do provider preferido, comeca por ele
  const resolvedStart = resolveModel(startModel, preferredProvider);
  const orderedChain = [
    { provider: preferredProvider, model: resolvedStart },
    ...chain.filter(
      (c) => !(c.provider === preferredProvider && c.model === resolvedStart)
    ),
  ];

  const attempts = [];
  const startTime = Date.now();

  for (const entry of orderedChain) {
    const circuitKey = getCircuitKey(entry.provider, entry.model);

    // Pular se circuit breaker aberto
    if (isCircuitOpen(circuitKey)) {
      attempts.push({ provider: entry.provider, model: entry.model, skipped: true, reason: "circuit-open" });
      continue;
    }

    // Retry loop para cada modelo
    let lastError;
    for (let retry = 0; retry <= MAX_RETRIES; retry++) {
      try {
        const text = await callProvider(entry.provider, entry.model, prompt, {
          system,
          temperature,
          maxTokens,
        });

        recordSuccess(circuitKey);

        return {
          text,
          provider: entry.provider,
          model: entry.model,
          attempts: [...attempts, { provider: entry.provider, model: entry.model, retry, success: true }],
          latencyMs: Date.now() - startTime,
        };
      } catch (err) {
        lastError = err;
        attempts.push({ provider: entry.provider, model: entry.model, retry, error: err.message, status: err.status });

        // Erros fatais: nao repetir
        if (err.status && isFatal(err.status)) {
          break;
        }

        // Backoff com jitter
        if (retry < MAX_RETRIES) {
          const backoff = err.retryAfter || INITIAL_BACKOFF_MS * Math.pow(2, retry);
          const jitter = backoff * (0.5 + Math.random() * 0.5);
          await new Promise((r) => setTimeout(r, jitter));
        }
      }
    }

    // Todos os retries falharam para este modelo
    recordFailure(circuitKey);
  }

  // Todos os providers falharam
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  throw new Error(
    `Todos os provedores de IA estao indisponiveis (${elapsed}s, ${attempts.length} tentativas). Tenta novamente em alguns minutos.`
  );
}

/**
 * Envia mensagens com imagens (vision) para o provider adequado.
 */
export async function callVision(messages, images, options = {}) {
  const { provider = "gemini", model = "gemini-2.0-flash", system, temperature = 0.7, maxTokens = 4096 } = options;

  // Gemini vision
  if (provider === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY nao configurada");

    const contents = [];
    if (system) {
      contents.push({ role: "user", parts: [{ text: system }] });
      contents.push({ role: "model", parts: [{ text: "Combinado." }] });
    }

    // Filtrar system messages duplicados quando system já foi fornecido
    const filteredMessages = system ? messages.filter((m) => m.role !== "system") : messages;

    for (const msg of filteredMessages) {
      if (msg.role === "user") {
        const parts = [{ text: msg.content }];
        if (images?.length > 0 && msg === messages.filter((m) => m.role === "user").pop()) {
          for (const img of images) {
            if (typeof img === "object" && img.inlineData) {
              parts.push(img);
            } else {
              const base64Data = typeof img === "string" ? (img.includes("base64,") ? img.split("base64,")[1] : img) : img;
              parts.push({ inlineData: { mimeType: "image/jpeg", data: base64Data } });
            }
          }
        }
        contents.push({ role: "user", parts });
      } else if (msg.role === "assistant") {
        contents.push({ role: "model", parts: [{ text: msg.content }] });
      }
    }

    const body = { contents, generationConfig: { temperature, maxOutputTokens: maxTokens, topP: 0.95 } };
    if (system) body.systemInstruction = { parts: [{ text: system }] };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const geminiModel = PROVIDERS.gemini.allowlist?.includes(model) ? model : PROVIDERS.gemini.defaultModel;
      const res = await fetch(`${PROVIDERS.gemini.baseUrl}/${geminiModel}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gemini Vision error ${res.status}: ${errorText}`);
      }
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // OpenRouter vision
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY nao configurada");

  const apiMessages = [];
  if (system) apiMessages.push({ role: "system", content: system });

  for (const msg of messages) {
    if (msg.role === "user") {
      const content = [{ type: "text", text: msg.content }];
      if (images?.length > 0 && msg === messages.filter((m) => m.role === "user").pop()) {
        for (const img of images) {
          content.push({ type: "image_url", image_url: { url: img } });
        }
      }
      apiMessages.push({ role: "user", content });
    } else {
      apiMessages.push({ role: msg.role, content: msg.content });
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(PROVIDERS.openrouter.baseUrl, {
      method: "POST",
      headers: PROVIDERS.openrouter.headers(apiKey),
      signal: controller.signal,
      body: JSON.stringify({ model, messages: apiMessages, temperature, max_tokens: maxTokens }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`OpenRouter Vision error ${res.status}: ${errorText}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } finally {
    clearTimeout(timeoutId);
  }
}
