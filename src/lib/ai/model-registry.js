/**
 * Eduka — Model Registry
 * Unico ponto de verdade para modelos, providers, capacidades e politica de custo.
 * Substitui a fragmentacao entre free-models.js, groq-models.js e openrouter-models.js.
 */

// ─── Provider metadata ─────────────────────────────────────

export const PROVIDERS = {
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    defaultModel: "meta-llama/llama-3.3-70b-instruct:free",
    headers: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://eduka.ao",
      "X-Title": "Eduka IA",
    }),
    envKey: "OPENROUTER_API_KEY",
  },
  groq: {
    id: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    defaultModel: "llama-3.3-70b-versatile",
    headers: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    envKey: "GROQ_API_KEY",
  },
  gemini: {
    id: "gemini",
    name: "Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/models",
    defaultModel: "gemini-2.0-flash",
    headers: () => ({ "Content-Type": "application/json" }),
    envKey: "GEMINI_API_KEY",
    allowlist: ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.5-pro"],
  },
  nvidia: {
    id: "nvidia",
    name: "NVIDIA",
    baseUrl: "https://integrate.api.nvidia.com/v1/chat/completions",
    defaultModel: "nvidia/nemotron-3-super-120b-a12b",
    headers: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    envKey: "NVIDIA_API_KEY",
  },
};

// ─── Model catalog ─────────────────────────────────────────

export const MODELS = [
  // Groq — rapidos
  { id: "llama-3.1-8b-instant", provider: "groq", speed: "rapido", vision: false, capabilities: ["text"] },
  { id: "llama-3.3-70b-versatile", provider: "groq", speed: "rapido", vision: false, capabilities: ["text"] },

  // OpenRouter — eficientes
  { id: "meta-llama/llama-3.3-70b-instruct:free", provider: "openrouter", speed: "eficiente", vision: false, capabilities: ["text", "json"] },
  { id: "openai/gpt-oss-120b:free", provider: "openrouter", speed: "eficiente", vision: false, capabilities: ["text", "json"] },
  { id: "openai/gpt-oss-20b:free", provider: "openrouter", speed: "rapido", vision: false, capabilities: ["text"] },
  { id: "nvidia/nemotron-3-super-120b-a12b:free", provider: "openrouter", speed: "eficiente", vision: false, capabilities: ["text", "json"] },
  { id: "qwen/qwen3-coder:free", provider: "openrouter", speed: "eficiente", vision: false, capabilities: ["text", "json", "code"] },
  { id: "google/gemma-4-31b-it:free", provider: "openrouter", speed: "eficiente", vision: true, capabilities: ["text", "vision"] },
  { id: "google/gemma-4-26b-a4b-it:free", provider: "openrouter", speed: "eficiente", vision: true, capabilities: ["text", "vision"] },

  // NVIDIA — direto
  { id: "nvidia/llama-3.3-nemotron-super-49b-v1.5", provider: "nvidia", speed: "eficiente", vision: false, capabilities: ["text"] },
  { id: "nvidia/nemotron-3-super-120b-a12b", provider: "nvidia", speed: "eficiente", vision: false, capabilities: ["text"] },

  // Gemini
  { id: "gemini-2.0-flash", provider: "gemini", speed: "eficiente", vision: true, capabilities: ["text", "vision", "pdf"] },
  { id: "gemini-2.5-flash", provider: "gemini", speed: "eficiente", vision: true, capabilities: ["text", "vision", "pdf"] },
  { id: "gemini-2.5-pro", provider: "gemini", speed: "lento", vision: true, capabilities: ["text", "vision", "pdf"] },
];

// ─── Fallback chains per capability ────────────────────────

const FALLBACK_CHAINS = {
  text: [
    { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct:free" },
    { provider: "groq", model: "llama-3.3-70b-versatile" },
    { provider: "nvidia", model: "nvidia/nemotron-3-super-120b-a12b" },
    { provider: "gemini", model: "gemini-2.0-flash" },
  ],
  json: [
    { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct:free" },
    { provider: "openrouter", model: "nvidia/nemotron-3-super-120b-a12b:free" },
    { provider: "groq", model: "llama-3.3-70b-versatile" },
    { provider: "gemini", model: "gemini-2.0-flash" },
  ],
  vision: [
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "openrouter", model: "google/gemma-4-31b-it:free" },
  ],
  pdf: [
    { provider: "gemini", model: "gemini-2.0-flash" },
  ],
};

// ─── Lookup helpers ────────────────────────────────────────

export function getModelById(id) {
  return MODELS.find((m) => m.id === id);
}

export function getProviderForModel(modelId) {
  const model = getModelById(modelId);
  return model?.provider || "openrouter";
}

export function getProviderConfig(providerId) {
  return PROVIDERS[providerId] || PROVIDERS.openrouter;
}

export function isVisionModel(modelId) {
  return getModelById(modelId)?.vision === true;
}

export function getDefaultModelForProvider(providerId) {
  return PROVIDERS[providerId]?.defaultModel || PROVIDERS.openrouter.defaultModel;
}

/**
 * Retorna a cadeia de fallback para uma capability, começando pelo provider preferido.
 * Nunca usa modelos incompativeis entre providers.
 */
export function getFallbackChain(preferredProvider, capability = "text") {
  const chain = FALLBACK_CHAINS[capability] || FALLBACK_CHAINS.text;
  const preferred = chain.filter((c) => c.provider === preferredProvider);
  const others = chain.filter((c) => c.provider !== preferredProvider);
  return [...preferred, ...others];
}

/**
 * Resolve o modelo efetivo: valida se existe no provider, senao usa o default.
 */
export function resolveModel(modelId, providerId) {
  const model = getModelById(modelId);
  if (model && model.provider === providerId) return modelId;
  return getDefaultModelForProvider(providerId);
}

/**
 * Cost weight por rota (para rate limit ponderado).
 */
export const ROUTE_COST = {
  chat: 1,
  explain: 1,
  improve: 1,
  estudo: 2,
  generate: 3,
  slides: 3,
  pdf: 3,
};

// Re-exports para compatibilidade com codigo existente
export const FREE_MODELS = MODELS.map((m) => ({
  id: m.id,
  name: m.id.split("/").pop().split(":")[0],
  speed: m.speed,
  provider: m.provider,
  vision: m.vision,
}));
