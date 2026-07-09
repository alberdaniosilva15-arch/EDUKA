/**
 * Eduka — OpenRouter Free Models
 * Only models with $0 cost (prompt + completion). Users NEVER pay.
 */

export const OPENROUTER_FREE_MODELS = [
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    name: "Llama 3.3 70B",
    shortName: "Llama 70B Free",
    description: "Modelo forte para explicacoes, trabalhos e raciocinio longo.",
    provider: "openrouter",
    context: 131072,
    quality: "alta",
  },
  {
    id: "openai/gpt-oss-120b:free",
    name: "GPT-OSS 120B",
    shortName: "GPT-OSS 120B Free",
    description: "Modelo grande da OpenAI para respostas profundas.",
    provider: "openrouter",
    context: 131072,
    quality: "alta",
  },
  {
    id: "openai/gpt-oss-20b:free",
    name: "GPT-OSS 20B",
    shortName: "GPT-OSS 20B Free",
    description: "Equilibrado, bom para conversa geral e conteudo.",
    provider: "openrouter",
    context: 131072,
    quality: "media",
  },
  {
    id: "qwen/qwen3-coder:free",
    name: "Qwen3 Coder 480B",
    shortName: "Qwen3 Coder Free",
    description: "Especialista em codigo e conteudo estruturado.",
    provider: "openrouter",
    context: 1048576,
    quality: "alta",
  },
  {
    id: "qwen/qwen3-next-80b-a3b-instruct:free",
    name: "Qwen3 Next 80B",
    shortName: "Qwen3 Next Free",
    description: "Bom para JSON, estruturas e conteudo academico.",
    provider: "openrouter",
    context: 262144,
    quality: "alta",
  },
  {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    name: "Nemotron 3 Super 120B",
    shortName: "Nemotron Super Free",
    description: "Modelo grande NVIDIA com contexto de 1M tokens.",
    provider: "openrouter",
    context: 1000000,
    quality: "alta",
  },
  {
    id: "google/gemma-4-31b-it:free",
    name: "Gemma 4 31B",
    shortName: "Gemma 4 Free",
    description: "Modelo Google, bom para portugues e conteudo geral.",
    provider: "openrouter",
    context: 262144,
    quality: "media",
  },
  {
    id: "google/gemma-4-26b-a4b-it:free",
    name: "Gemma 4 26B",
    shortName: "Gemma 4 26B Free",
    description: "Variante leve do Gemma 4, rapido e eficiente.",
    provider: "openrouter",
    context: 262144,
    quality: "media",
  },
];

export const OPENROUTER_FREE_MODEL_IDS = OPENROUTER_FREE_MODELS.map((m) => m.id);

export function isOpenRouterFreeModel(modelId) {
  return OPENROUTER_FREE_MODEL_IDS.includes(modelId);
}
