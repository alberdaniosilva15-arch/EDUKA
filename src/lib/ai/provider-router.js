/**
 * Eduka — Provider Router
 * Retry, backoff, circuit breaker e fallback entre providers FREE.
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

// ─── Circuit breaker ────────────────────────────────────────

const circuitState = new Map();

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
    state.openUntil = Date.now() + 60_000;
  }
  circuitState.set(key, state);
}

function recordSuccess(key) {
  circuitState.delete(key);
}

// ─── Error detection ────────────────────────────────────────

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

// ─── Provider caller (OpenAI-compatible) ────────────────────

async function callProvider(providerId, model, promptOrMessages, options) {
  const config = getProviderConfig(providerId);
  const apiKey = process.env[config.envKey];
  if (!apiKey) throw new Error(`${config.envKey} nao configurada`);

  let messages;
  if (Array.isArray(promptOrMessages)) {
    messages = [
      ...(options.system ? [{ role: "system", content: options.system }] : []),
      ...promptOrMessages.filter((m) => m.role !== "system"),
    ];
  } else {
    messages = [
      ...(options.system ? [{ role: "system", content: options.system }] : []),
      { role: "user", content: promptOrMessages },
    ];
  }

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
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 8192,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      const err = new Error(`${config.name} error ${res.status}: ${errorText}`);
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

// ─── Main entry point ──────────────────────────────────────

export async function generateContent(promptOrMessages, options = {}) {
  const {
    provider: preferredProvider = "groq",
    model: preferredModel,
    capability = "text",
    system,
    temperature = 0.7,
    maxTokens = 8192,
  } = options;

  const chain = getFallbackChain(preferredProvider, capability);
  const startModel = preferredModel || getDefaultModelForProvider(preferredProvider);

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

    if (isCircuitOpen(circuitKey)) {
      attempts.push({ provider: entry.provider, model: entry.model, skipped: true, reason: "circuit-open" });
      continue;
    }

    let lastError;
    for (let retry = 0; retry <= MAX_RETRIES; retry++) {
      try {
        const text = await callProvider(entry.provider, entry.model, promptOrMessages, {
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

        if (err.status && isFatal(err.status)) {
          break;
        }

        if (retry < MAX_RETRIES) {
          const backoff = err.retryAfter || INITIAL_BACKOFF_MS * Math.pow(2, retry);
          const jitter = backoff * (0.5 + Math.random() * 0.5);
          await new Promise((r) => setTimeout(r, jitter));
        }
      }
    }

    recordFailure(circuitKey);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  throw new Error(
    `Todos os provedores de IA estao indisponiveis (${elapsed}s, ${attempts.length} tentativas). Tenta novamente em alguns minutos.`
  );
}

// ─── Vision (OpenRouter free) ──────────────────────────────

export async function callVision(messages, images, options = {}) {
  const { model = "google/gemma-4-26b-a4b-it:free", system, temperature = 0.7, maxTokens = 4096 } = options;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY nao configurada");

  const apiMessages = [];
  if (system) apiMessages.push({ role: "system", content: system });

  for (const msg of messages) {
    if (msg.role === "user") {
      const content = [{ type: "text", text: msg.content }];
      if (images?.length > 0 && msg === messages.filter((m) => m.role === "user").pop()) {
        for (const img of images) {
          if (typeof img === "string") {
            content.push({ type: "image_url", image_url: { url: img } });
          } else if (img?.inlineData) {
            const { mimeType, data } = img.inlineData;
            if (mimeType?.startsWith("image/")) {
              content.push({ type: "image_url", image_url: { url: `data:${mimeType};base64,${data}` } });
            }
            // PDFs em inlineData são intencionalmente ignorados aqui;
            // OpenRouter free vision não aceita PDF nativamente e a análise
            // completa de PDF já existe em /api/pdf.
            // Cai no fallback de descrição genérica no chat/route.js.
          }
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
