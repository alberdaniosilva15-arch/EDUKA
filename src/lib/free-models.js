/**
 * Eduka — Free Models Registry
 * ALL models cost $0. Users choose by SPEED, not by provider.
 * vision: true means the model supports image/pdf input
 */

export const FREE_MODELS = [
  // ─── RAPIDOS (chat ao vivo, respostas curtas) ──────
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 8B",
    speed: "rapido",
    provider: "groq",
    vision: false,
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 70B",
    speed: "rapido",
    provider: "groq",
    vision: false,
  },
  {
    id: "openai/gpt-oss-20b:free",
    name: "GPT 20B",
    speed: "rapido",
    provider: "openrouter",
    vision: false,
  },

  // ─── EFICIENTES (trabalhos, slides, conteudo longo) ─
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    name: "Llama 70B",
    speed: "eficiente",
    provider: "openrouter",
    vision: false,
  },
  {
    id: "openai/gpt-oss-120b:free",
    name: "GPT 120B",
    speed: "eficiente",
    provider: "openrouter",
    vision: false,
  },
  {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    name: "Nemotron 120B",
    speed: "eficiente",
    provider: "openrouter",
    vision: false,
  },
  {
    id: "qwen/qwen3-coder:free",
    name: "Qwen3 Coder",
    speed: "eficiente",
    provider: "openrouter",
    vision: false,
  },
  {
    id: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
    name: "Nemotron 49B",
    speed: "eficiente",
    provider: "nvidia",
    vision: false,
  },
  {
    id: "nvidia/nemotron-3-super-120b-a12b",
    name: "Nemotron 120B",
    speed: "eficiente",
    provider: "nvidia",
    vision: false,
  },
  {
    id: "google/gemma-4-31b-it:free",
    name: "Gemma 4",
    speed: "eficiente",
    provider: "openrouter",
    vision: true,
  },
  // ─── VISION (modelos com capacidade de ver imagens/PDFs) ─
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    speed: "eficiente",
    provider: "gemini",
    vision: true,
  },
  {
    id: "google/gemma-4-26b-a4b-it:free",
    name: "Gemma 4 26B",
    speed: "eficiente",
    provider: "openrouter",
    vision: true,
  },
  {
    id: "nvidia/nemotron-nano-12b-v2-vl:free",
    name: "Nemotron Nano VL",
    speed: "eficiente",
    provider: "openrouter",
    vision: true,
  },
];

export function getFastModels() {
  return FREE_MODELS.filter((m) => m.speed === "rapido");
}

export function getEfficientModels() {
  return FREE_MODELS.filter((m) => m.speed === "eficiente");
}

export function getVisionModels() {
  return FREE_MODELS.filter((m) => m.vision === true);
}

export function getModelById(id) {
  return FREE_MODELS.find((m) => m.id === id);
}

export function isVisionModel(modelId) {
  const model = getModelById(modelId);
  return model?.vision === true;
}

export function getProviderForModel(modelId) {
  const model = getModelById(modelId);
  if (!model) return "openrouter";
  if (model.provider === "nvidia") return "nvidia";
  if (model.provider === "groq") return "groq";
  if (model.provider === "gemini") return "gemini";
  return "openrouter";
}
