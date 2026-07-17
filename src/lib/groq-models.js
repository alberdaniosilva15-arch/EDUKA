/**
 * Eduka Groq model allow-list.
 * Keep the public chat locked to text models that are suitable for a free/dev plan.
 */

export const GROQ_FREE_MODELS = [
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B Instant",
    shortName: "Llama 8B",
    description: "Rapido para duvidas curtas, resumos e estudo diario.",
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B Versatile",
    shortName: "Llama 70B",
    description: "Mais forte para explicacoes, trabalhos e raciocinio longo.",
  },
];

export const GROQ_FREE_MODEL_IDS = GROQ_FREE_MODELS.map((model) => model.id);
export const DEFAULT_GROQ_CHAT_MODEL = GROQ_FREE_MODELS[0].id;

export function isAllowedGroqChatModel(modelId) {
  return GROQ_FREE_MODEL_IDS.includes(modelId);
}

export function getGroqChatModel(modelId) {
  return GROQ_FREE_MODELS.find((model) => model.id === modelId) || GROQ_FREE_MODELS[0];
}
