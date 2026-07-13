/**
 * Eduka AI Provider — Multi-provider router (OpenRouter + Groq + Gemini)
 * Auto-fallback: OpenRouter -> Groq -> Gemini
 * Users can only select FREE models (cost = $0)
 * VISION SUPPORT: Gemini + OpenRouter vision models
 */
import { DEFAULT_GROQ_CHAT_MODEL } from "@/lib/groq-models";

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_TIMEOUT_MS = 45000;

const GEMINI_MODEL_ALLOWLIST = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.5-pro"];

export const DEFAULT_MODELS = {
  openrouter: "meta-llama/llama-3.3-70b-instruct:free",
  groq: "llama-3.3-70b-versatile",
  nvidia: "nvidia/nemotron-3-super-120b-a12b",
  gemini: "gemini-2.0-flash",
};

function getGeminiUrl(model) {
  const m = GEMINI_MODEL_ALLOWLIST.includes(model) ? model : "gemini-2.0-flash";
  return `${GEMINI_BASE_URL}/${m}:generateContent`;
}
// ─── Helpers ──────────────────────────────────────────────────

function buildGeminiContents(prompt, images) {
  const parts = [{ text: prompt }];
  if (images && images.length > 0) {
    for (const img of images) {
      const base64Data = img.includes("base64,") ? img.split("base64,")[1] : img;
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data,
        },
      });
    }
  }
  return { contents: [{ parts }] };
}

function buildGeminiMessages(messages, images, system) {
  // Converte messages array para formato Gemini com imagens no user message
  const geminiContents = [];

  // Se houver system prompt, insere como primeira conversa user/model
  if (system) {
    geminiContents.push({
      role: "user",
      parts: [{ text: system }],
    });
    geminiContents.push({
      role: "model",
      parts: [{ text: "Combinado. Vou seguir estas instrucoes." }],
    });
  }

  for (const msg of messages) {
    if (msg.role === "system") {
      // System prompt inline no array de mensagens
      geminiContents.push({
        role: "user",
        parts: [{ text: msg.content }],
      });
      geminiContents.push({
        role: "model",
        parts: [{ text: "Combinado. Vou seguir estas instrucoes." }],
      });
    } else if (msg.role === "user") {
      const parts = [{ text: msg.content }];
      // Adiciona imagens apenas na ultima mensagem do user
      if (images && images.length > 0 && msg === messages.filter(m => m.role === "user").pop()) {
        for (const img of images) {
          // Suporta dois formatos: string base64 (imagens) e objetos inlineData (PDFs)
          if (typeof img === "object" && img.inlineData) {
            parts.push(img);
          } else {
            const base64Data = typeof img === "string"
              ? (img.includes("base64,") ? img.split("base64,")[1] : img)
              : img;
            parts.push({
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data,
              },
            });
          }
        }
      }
      geminiContents.push({ role: "user", parts });
    } else if (msg.role === "assistant") {
      geminiContents.push({
        role: "model",
        parts: [{ text: msg.content }],
      });
    }
  }

  return { contents: geminiContents };
}

// ─── Gemini ──────────────────────────────────────────────────

async function callGemini(prompt, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY nao configurada");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const body = buildGeminiContents(prompt, options.images);
    body.generationConfig = {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? 8192,
      topP: 0.95,
    };

    const model = options.model || "gemini-2.0-flash";
    const res = await fetch(`${getGeminiUrl(model)}?key=${apiKey}`, {
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
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Gemini Vision - envia mensagens com imagens
 */
export async function callGeminiVision(messages, images, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY nao configurada");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const body = buildGeminiMessages(messages, images, options.system);
    body.generationConfig = {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? 8192,
      topP: 0.95,
    };

    if (options.system) {
      body.systemInstruction = { parts: [{ text: options.system }] };
    }

    const model = options.model || "gemini-2.0-flash";
    const res = await fetch(`${getGeminiUrl(model)}?key=${apiKey}`, {
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
          ...messages,
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

// ─── OpenRouter (FREE models only) ───────────────────────────

export async function callOpenRouterMessages(messages, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY nao configurada");

  const {
    model = "meta-llama/llama-3.3-70b-instruct:free",
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
          ...messages,
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

/**
 * OpenRouter Vision - envia mensagens com imagens (formato base64)
 */
export async function callOpenRouterVision(messages, images, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY nao configurada");

  const {
    model = "google/gemma-4-31b-it:free",
    system = "Es um assistente academico da Eduka para estudantes angolanos. Responde em portugues de Angola/Portugal, com clareza, rigor e utilidade pratica.",
    temperature = 0.7,
    maxTokens = 8192,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  // Converte formato para OpenRouter com image_url
  const apiMessages = [
    { role: "system", content: system },
  ];

  for (const msg of messages) {
    if (msg.role === "user") {
      // Se for a ultima mensagem do user e temos imagens, adiciona como conteudo multimodal
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

// ─── NVIDIA ──────────────────────────────────────────────────

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

export async function callNvidiaMessages(messages, options = {}) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error("NVIDIA_API_KEY nao configurada");

  const {
    model = "nvidia/nemotron-3-super-120b-a12b",
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
          ...messages,
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

/**
 * Envia mensagens com imagens para o modelo adequado
 * Gemini: suporte nativo a imagens/PDF
 * OpenRouter: modelos com :free que suportam visao
 */
export async function callVision(messages, images, options = {}) {
  const modelId = options.model || "gemini-2.0-flash";

  if (modelId.includes("gemini") || options.provider === "gemini") {
    return callGeminiVision(messages, images, options);
  }

  // OpenRouter vision models
  return callOpenRouterVision(messages, images, {
    ...options,
    model: modelId,
  });
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
  const { provider = "openrouter" } = options;

  const providersConfig = {
    openrouter: { fn: (opts) => callOpenRouter(prompt, opts), name: "OpenRouter", id: "openrouter" },
    groq: { fn: (opts) => callGroq(prompt, opts), name: "Groq", id: "groq" },
    nvidia: { fn: (opts) => callNvidia(prompt, opts), name: "NVIDIA", id: "nvidia" },
    gemini: { fn: (opts) => callGemini(prompt, opts), name: "Gemini", id: "gemini" },
  };

  const order = ["openrouter", "groq", "nvidia", "gemini"];
  const selectedConfig = providersConfig[provider] || providersConfig.openrouter;
  const restConfig = order.filter((p) => p !== selectedConfig.id);

  const fallbackChain = [selectedConfig, ...restConfig.map(p => providersConfig[p])];
  const fns = [];
  const names = [];

  for (const p of fallbackChain) {
    names.push(p.name);
    fns.push(() => {
      // Usar options.model se for o provider original, caso contrario usa o default
      const useModel = (p.id === selectedConfig.id && options.model)
        ? options.model
        : DEFAULT_MODELS[p.id];
        
      return p.fn({ ...options, model: useModel });
    });
  }

  return tryWithFallback(fns, names);
}
