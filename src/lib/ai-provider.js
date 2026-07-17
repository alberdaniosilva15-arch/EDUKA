/**
 * Eduka AI Provider — Multi-provider router (Groq + OpenCode + NVIDIA + OpenRouter)
 * Auto-fallback: Groq -> OpenCode -> NVIDIA -> OpenRouter
 * Apenas modelos FREE
 */
import { DEFAULT_GROQ_CHAT_MODEL } from "@/lib/groq-models";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENCODE_API_URL = "https://opencode.ai/zen/v1/chat/completions";
const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const API_TIMEOUT_MS = 45000;

export const DEFAULT_MODELS = {
  groq: "llama-3.3-70b-versatile",
  opencode: "deepseek-v4-flash-free",
  nvidia: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
  openrouter: "nvidia/nemotron-3-ultra-550b-a55b:free",
};

// ─── Groq ────────────────────────────────────────────────────

export async function callGroqMessages(messages, options = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY nao configurada");

  const {
    model = DEFAULT_GROQ_CHAT_MODEL,
    system = "Es um assistente academico da Eduka para estudantes angolanos. Responde em portugues de Angola/Portugal, com clareza, rigor e utilidade pratica.",
    temperature = 0.7,
    maxTokens = 8192,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          ...messages.filter((m) => m.role !== "system"),
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Groq error ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callGroq(prompt, options = {}) {
  return callGroqMessages([{ role: "user", content: prompt }], {
    model: options.model || DEFAULT_MODELS.groq,
    system: options.system,
    temperature: options.temperature,
    maxTokens: options.maxTokens,
  });
}

// ─── OpenCode (FREE) ────────────────────────────────────────

export async function callOpenCodeMessages(messages, options = {}) {
  const apiKey = process.env.OPENCODE_API_KEY;
  if (!apiKey) throw new Error("OPENCODE_API_KEY nao configurada");

  const {
    model = "deepseek-v4-flash-free",
    system = "Es um assistente academico da Eduka para estudantes angolanos. Responde em portugues de Angola/Portugal, com clareza, rigor e utilidade pratica.",
    temperature = 0.7,
    maxTokens = 8192,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(OPENCODE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          ...messages.filter((m) => m.role !== "system"),
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`OpenCode error ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callOpenCode(prompt, options = {}) {
  return callOpenCodeMessages([{ role: "user", content: prompt }], {
    model: options.model || DEFAULT_MODELS.opencode,
    system: options.system,
    temperature: options.temperature,
    maxTokens: options.maxTokens,
  });
}

// ─── OpenRouter (FREE) ──────────────────────────────────────

export async function callOpenRouterMessages(messages, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY nao configurada");

  const {
    model = "nvidia/nemotron-3-ultra-550b-a55b:free",
    system = "Es um assistente academico da Eduka para estudantes angolanos. Responde em portugues de Angola/Portugal, com clareza, rigor e utilidade pratica.",
    temperature = 0.7,
    maxTokens = 8192,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://eduka.ao",
        "X-Title": "Eduka IA",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          ...messages.filter((m) => m.role !== "system"),
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`OpenRouter error ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callOpenRouter(prompt, options = {}) {
  return callOpenRouterMessages([{ role: "user", content: prompt }], {
    model: options.model || DEFAULT_MODELS.openrouter,
    system: options.system,
    temperature: options.temperature,
    maxTokens: options.maxTokens,
  });
}

// ─── OpenRouter Vision (FREE) ───────────────────────────────

export async function callOpenRouterVision(messages, images, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY nao configurada");

  const {
    model = "google/gemma-4-26b-a4b-it:free",
    system = "Es um assistente academico da Eduka para estudantes angolanos. Responde em portugues de Angola/Portugal, com clareza, rigor e utilidade pratica.",
    temperature = 0.7,
    maxTokens = 8192,
  } = options;

  const apiMessages = [
    { role: "system", content: system },
  ];

  for (const msg of messages) {
    if (msg.role === "user") {
      const content = [{ type: "text", text: msg.content }];
      
      if (images && images.length > 0 && msg === messages.filter(m => m.role === "user").pop()) {
        for (const img of images) {
          content.push({
            type: "image_url",
            image_url: { url: img },
          });
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
    const res = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://eduka.ao",
        "X-Title": "Eduka IA",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: apiMessages,
        temperature,
        max_tokens: maxTokens,
      }),
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

// ─── NVIDIA (FREE) ──────────────────────────────────────────

export async function callNvidiaMessages(messages, options = {}) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error("NVIDIA_API_KEY nao configurada");

  const {
    model = "nvidia/llama-3.3-nemotron-super-49b-v1.5",
    system = "Es um assistente academico da Eduka para estudantes angolanos. Responde em portugues de Angola/Portugal, com clareza, rigor e utilidade pratica.",
    temperature = 0.7,
    maxTokens = 8192,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(NVIDIA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          ...messages.filter((m) => m.role !== "system"),
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`NVIDIA error ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callNvidia(prompt, options = {}) {
  return callNvidiaMessages([{ role: "user", content: prompt }], {
    model: options.model || DEFAULT_MODELS.nvidia,
    system: options.system,
    temperature: options.temperature,
    maxTokens: options.maxTokens,
  });
}

// ─── Vision Router ───────────────────────────────────────────

export async function callVision(messages, images, options = {}) {
  return callOpenRouterVision(messages, images, options);
}

// ─── Fallback chain ──────────────────────────────────────────

async function tryWithFallback(fns, names) {
  for (let i = 0; i < fns.length; i++) {
    try {
      return await fns[i]();
    } catch (err) {
      console.warn(`[AI Provider] ${names[i]} falhou:`, err.message);
      if (i === fns.length - 1) {
        throw new Error(
          "Todos os provedores de IA estao indisponiveis. Tenta novamente em alguns minutos."
        );
      }
    }
  }
}

/**
 * Gera conteudo com fallback automatico entre providers
 */
export async function generateContent(prompt, options = {}) {
  const { provider = "groq" } = options;

  const providersConfig = {
    groq: { fn: (opts) => callGroq(prompt, opts), name: "Groq", id: "groq" },
    opencode: { fn: (opts) => callOpenCode(prompt, opts), name: "OpenCode", id: "opencode" },
    nvidia: { fn: (opts) => callNvidia(prompt, opts), name: "NVIDIA", id: "nvidia" },
    openrouter: { fn: (opts) => callOpenRouter(prompt, opts), name: "OpenRouter", id: "openrouter" },
  };

  const order = ["groq", "opencode", "nvidia", "openrouter"];
  const selectedConfig = providersConfig[provider] || providersConfig.groq;
  const restConfig = order.filter((p) => p !== selectedConfig.id);

  const fallbackChain = [selectedConfig, ...restConfig.map(p => providersConfig[p])];
  const fns = [];
  const names = [];

  for (const p of fallbackChain) {
    names.push(p.name);
    fns.push(() => {
      const useModel = (p.id === selectedConfig.id && options.model)
        ? options.model
        : DEFAULT_MODELS[p.id];
        
      return p.fn({ ...options, model: useModel });
    });
  }

  return tryWithFallback(fns, names);
}
