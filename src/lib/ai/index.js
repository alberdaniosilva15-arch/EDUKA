/**
 * Eduka — AI Module Index
 * Ponto de entrada único para toda a infraestrutura de IA.
 */
export { generateContent, callVision } from "./provider-router";
export {
  PROVIDERS,
  MODELS,
  getModelById,
  getProviderForModel,
  getProviderConfig,
  isVisionModel,
  getDefaultModelForProvider,
  getFallbackChain,
  resolveModel,
  ROUTE_COST,
  FREE_MODELS,
} from "./model-registry";

// Systems
export { BASE_EDUKA_SYSTEM, buildSystemWithPersona } from "./systems/base";
export { WORK_SYSTEM } from "./systems/work";
export { EXPLAIN_SYSTEM } from "./systems/explain";
export { IMPROVE_SYSTEM } from "./systems/improve";
export { STUDY_SYSTEM } from "./systems/study";
export { CHAT_SYSTEM } from "./systems/chat";
export { SLIDES_SYSTEM } from "./prompts/slides";

// Prompts
export { buildSlidesPrompt, SLIDE_SCHEMA_DESCRIPTION } from "./prompts/slides";
export { buildWorkPrompt, WORK_RUBRIC } from "./prompts/work";
export { buildExplainPrompt } from "./prompts/explain";
export { buildImprovePrompt } from "./prompts/improve";
export { buildStudyPrompt } from "./prompts/study";

// Schemas & Quality
export {
  slideOutputSchema,
  slidesOutputSchema,
  workOutputSchema,
  repairSlide,
  repairSlides,
  repairWork,
  scoreSlide,
  scoreSlides,
  scoreWork,
} from "./schemas/output";

export {
  evaluateSlidesQuality,
  evaluateWorkQuality,
  decidePostProcessing,
} from "./quality/rubrics";
