/**
 * Eduka — Model Registry
 * Apenas modelos FREE que funcionam.
 */

// ─── Provider metadata ─────────────────────────────────────

export const PROVIDERS = {
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
  opencode: {
    id: "opencode",
    name: "OpenCode",
    baseUrl: "https://opencode.ai/zen/v1/chat/completions",
    defaultModel: "deepseek-v4-flash-free",
    headers: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    envKey: "OPENCODE_API_KEY",
  },
  nvidia: {
    id: "nvidia",
    name: "NVIDIA",
    baseUrl: "https://integrate.api.nvidia.com/v1/chat/completions",
    defaultModel: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
    headers: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    envKey: "NVIDIA_API_KEY",
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    defaultModel: "nvidia/nemotron-3-ultra-550b-a55b:free",
    headers: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://eduka.ao",
      "X-Title": "Eduka IA",
    }),
    envKey: "OPENROUTER_API_KEY",
  },
};

// ─── Model catalog ─────────────────────────────────────────

export const MODELS = [
  // Groq — rapidos e estaveis
  { id: "llama-3.3-70b-versatile", provider: "groq", speed: "rapido", vision: false, capabilities: ["text", "json"] },
  { id: "llama-3.1-8b-instant", provider: "groq", speed: "rapido", vision: false, capabilities: ["text"] },

  // OpenCode — free models
  { id: "deepseek-v4-flash-free", provider: "opencode", speed: "rapido", vision: false, capabilities: ["text", "json", "code"] },
  { id: "mimo-v2.5-free", provider: "opencode", speed: "rapido", vision: false, capabilities: ["text", "code"] },
  { id: "hy3-free", provider: "opencode", speed: "eficiente", vision: false, capabilities: ["text", "json"] },
  { id: "nemotron-3-ultra-free", provider: "opencode", speed: "eficiente", vision: false, capabilities: ["text", "json"] },
  { id: "north-mini-code-free", provider: "opencode", speed: "rapido", vision: false, capabilities: ["text", "code"] },

  // NVIDIA — free models (API direta)
  { id: "nvidia/llama-3.3-nemotron-super-49b-v1.5", provider: "nvidia", speed: "eficiente", vision: false, capabilities: ["text"] },
  { id: "nvidia/nemotron-3-super-120b-a12b", provider: "nvidia", speed: "eficiente", vision: false, capabilities: ["text"] },

  // OpenRouter — free models que funcionam
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", provider: "openrouter", speed: "eficiente", vision: false, capabilities: ["text", "json"] },
  { id: "google/gemma-4-26b-a4b-it:free", provider: "openrouter", speed: "eficiente", vision: true, capabilities: ["text", "vision"] },
  { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", provider: "openrouter", speed: "eficiente", vision: false, capabilities: ["text", "json"] },
  { id: "nvidia/nemotron-3-nano-30b-a3b:free", provider: "openrouter", speed: "rapido", vision: false, capabilities: ["text"] },
  { id: "openai/gpt-oss-20b:free", provider: "openrouter", speed: "rapido", vision: false, capabilities: ["text"] },
  { id: "nvidia/nemotron-nano-9b-v2:free", provider: "openrouter", speed: "rapido", vision: false, capabilities: ["text"] },
  { id: "nvidia/nemotron-nano-12b-v2-vl:free", provider: "openrouter", speed: "rapido", vision: true, capabilities: ["text", "vision"] },
];

// ─── Fallback chains ───────────────────────────────────────

const FALLBACK_CHAINS = {
  text: [
    { provider: "groq", model: "llama-3.3-70b-versatile" },
    { provider: "opencode", model: "deepseek-v4-flash-free" },
    { provider: "nvidia", model: "nvidia/llama-3.3-nemotron-super-49b-v1.5" },
    { provider: "openrouter", model: "nvidia/nemotron-3-ultra-550b-a55b:free" },
    { provider: "opencode", model: "nemotron-3-ultra-free" },
  ],
  json: [
    { provider: "groq", model: "llama-3.3-70b-versatile" },
    { provider: "opencode", model: "deepseek-v4-flash-free" },
    { provider: "nvidia", model: "nvidia/nemotron-3-super-120b-a12b" },
    { provider: "opencode", model: "hy3-free" },
  ],
  vision: [
    { provider: "openrouter", model: "google/gemma-4-26b-a4b-it:free" },
    { provider: "openrouter", model: "nvidia/nemotron-nano-12b-v2-vl:free" },
  ],
  pdf: [
    { provider: "openrouter", model: "google/gemma-4-26b-a4b-it:free" },
  ],
  code: [
    { provider: "opencode", model: "mimo-v2.5-free" },
    { provider: "opencode", model: "north-mini-code-free" },
    { provider: "opencode", model: "deepseek-v4-flash-free" },
    { provider: "groq", model: "llama-3.3-70b-versatile" },
  ],
};

// ─── Lookup helpers ────────────────────────────────────────

export function getModelById(id) {
  return MODELS.find((m) => m.id === id);
}

export function getProviderForModel(modelId) {
  const model = getModelById(modelId);
  return model?.provider || "groq";
}

export function getProviderConfig(providerId) {
  return PROVIDERS[providerId] || PROVIDERS.groq;
}

export function isVisionModel(modelId) {
  return getModelById(modelId)?.vision === true;
}

export function getDefaultModelForProvider(providerId) {
  return PROVIDERS[providerId]?.defaultModel || PROVIDERS.groq.defaultModel;
}

export function getFallbackChain(preferredProvider, capability = "text") {
  const chain = FALLBACK_CHAINS[capability] || FALLBACK_CHAINS.text;
  const preferred = chain.filter((c) => c.provider === preferredProvider);
  const others = chain.filter((c) => c.provider !== preferredProvider);
  return [...preferred, ...others];
}

export function resolveModel(modelId, providerId) {
  const model = getModelById(modelId);
  if (model && model.provider === providerId) return modelId;
  return getDefaultModelForProvider(providerId);
}

export const ROUTE_COST = {
  chat: 1,
  explain: 1,
  improve: 1,
  estudo: 2,
  generate: 3,
  slides: 3,
  pdf: 3,
};

export const FREE_MODELS = MODELS.map((m) => ({
  id: m.id,
  name: m.id.split("/").pop().split(":")[0],
  speed: m.speed,
  provider: m.provider,
  vision: m.vision,
}));
