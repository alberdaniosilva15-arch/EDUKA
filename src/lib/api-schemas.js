/**
 * Eduka — API Schemas (Zod)
 * Validação de input por rota: tipo + tamanho + formato
 */
import { z } from 'zod';
import { DEFAULT_GROQ_CHAT_MODEL, GROQ_FREE_MODEL_IDS } from '@/lib/groq-models';

// Limites globais de payload (proteção contra custo)
const MAX_THEME = 5000;
const MAX_TEXT = 5000;
const MAX_FIELD = 2000;
const MAX_CHAT_MESSAGE = 6000;

// ─── /api/generate ───────────────────────────────────────────
export const generateSchema = z.object({
  tema: z
    .string({ required_error: "Tema é obrigatório." })
    .min(3, "Tema deve ter pelo menos 3 caracteres.")
    .max(MAX_THEME, `Tema não pode exceder ${MAX_THEME} caracteres.`)
    .trim(),
  curso: z
    .string()
    .max(200, `Curso não pode exceder 200 caracteres.`)
    .optional()
    .default(''),
  nivel: z
    .string()
    .max(50)
    .optional()
    .default('universitario'),
  paginas: z
    .string()
    .max(20)
    .optional()
    .default('5'),
  requisitos: z
    .string()
    .max(MAX_FIELD, `Requisitos não pode exceder ${MAX_FIELD} caracteres.`)
    .optional()
    .default(''),
});

// ─── /api/improve ────────────────────────────────────────────
export const improveSchema = z.object({
  texto: z
    .string({ required_error: "Texto é obrigatório." })
    .min(10, "Texto deve ter pelo menos 10 caracteres.")
    .max(MAX_TEXT, `Texto não pode exceder ${MAX_TEXT} caracteres.`)
    .trim(),
  tipo: z
    .string()
    .max(100)
    .optional()
    .default('Geral'),
});

// ─── /api/explain ────────────────────────────────────────────
export const explainSchema = z.object({
  tema: z
    .string({ required_error: "Tema é obrigatório." })
    .min(3, "Tema deve ter pelo menos 3 caracteres.")
    .max(MAX_THEME, `Tema não pode exceder ${MAX_THEME} caracteres.`)
    .trim(),
  nivel: z
    .string()
    .max(50)
    .optional()
    .default('universitario'),
});

// ─── /api/slides ─────────────────────────────────────────────
export const slidesSchema = z.object({
  topic: z
    .string({ required_error: "Tema é obrigatório." })
    .min(3, "Tema deve ter pelo menos 3 caracteres.")
    .max(MAX_THEME, `Tema não pode exceder ${MAX_THEME} caracteres.`)
    .trim(),
  numSlides: z
    .coerce
    .number({ invalid_type_error: "Número de slides deve ser um número." })
    .int("Número de slides deve ser inteiro.")
    .min(3, "Mínimo de 3 slides.")
    .max(20, "Máximo de 20 slides."),
  style: z
    .string()
    .max(100)
    .optional()
    .default('académico formal'),
  model: z
    .string()
    .max(200)
    .optional()
    .default('meta-llama/llama-3.3-70b-instruct:free'),
});

// ─── /api/estudo ─────────────────────────────────────────────
export const estudoSchema = z.object({
  topic: z
    .string({ required_error: "Tema é obrigatório." })
    .min(3, "Tema deve ter pelo menos 3 caracteres.")
    .max(MAX_THEME, `Tema não pode exceder ${MAX_THEME} caracteres.`)
    .trim(),
  timeframe: z
    .string({ required_error: "Tempo disponível é obrigatório." })
    .min(1, "Tempo disponível é obrigatório.")
    .max(100, "Tempo disponível não pode exceder 100 caracteres.")
    .trim(),
  course: z
    .string()
    .max(200)
    .optional()
    .default(''),
  difficulty: z
    .string()
    .max(50)
    .optional()
    .default('média'),
  model: z
    .string()
    .max(200)
    .optional()
    .default('meta-llama/llama-3.3-70b-instruct:free'),
});

// ─── /api/chat ───────────────────────────────────────────────
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_FILES = 5;
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

const fileSchema = z.object({
  name: z.string().max(255),
  type: z.string().refine((t) => ALLOWED_MIME.includes(t), {
    message: "Tipo de ficheiro não suportado. Apenas PNG, JPEG, WebP e PDF.",
  }),
  data: z.string().max(7 * 1024 * 1024, "Ficheiro excede 5MB (limite base64)."),
});

export const chatSchema = z.object({
  model: z
    .string()
    .optional()
    .default(DEFAULT_GROQ_CHAT_MODEL),
  messages: z
    .array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z
        .string({ required_error: "Mensagem obrigatória." })
        .min(1, "Mensagem vazia.")
        .max(MAX_CHAT_MESSAGE, `Mensagem não pode exceder ${MAX_CHAT_MESSAGE} caracteres.`)
        .trim(),
    }))
    .min(1, "Envia pelo menos uma mensagem.")
    .max(30, "A conversa enviada é demasiado longa."),
  files: z
    .array(fileSchema)
    .max(MAX_FILES, `Máximo ${MAX_FILES} ficheiros.`)
    .optional()
    .default([]),
});
