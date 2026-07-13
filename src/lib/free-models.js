/**
 * Eduka — Free Models Registry (compatibility layer)
 * Re-exports from the unified model-registry.js.
 * This file maintains backward compatibility with existing imports.
 */
import {
  MODELS as _MODELS,
  FREE_MODELS as _FREE_MODELS,
  getModelById as _getModelById,
  getProviderForModel as _getProviderForModel,
  isVisionModel as _isVisionModel,
} from "@/lib/ai/model-registry";

export const FREE_MODELS = _FREE_MODELS;
export const MODELS = _MODELS;

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
  return _getModelById(id);
}

export function isVisionModel(modelId) {
  return _isVisionModel(modelId);
}

export function getProviderForModel(modelId) {
  return _getProviderForModel(modelId);
}
