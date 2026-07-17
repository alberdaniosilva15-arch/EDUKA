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
  // Campos escolares
  nomes_alunos: z
    .string()
    .max(MAX_FIELD, `Nomes não pode exceder ${MAX_FIELD} caracteres.`)
    .optional()
    .default(''),
  turma: z
    .string()
    .max(100, `Turma não pode exceder 100 caracteres.`)
    .optional()
    .default(''),
  professor: z
    .string()
    .max(200, `Nome do professor não pode exceder 200 caracteres.`)
    .optional()
    .default(''),
  disciplina: z
    .string()
    .max(200, `Disciplina não pode exceder 200 caracteres.`)
    .optional()
    .default(''),
  escola: z
    .string()
    .max(300, `Nome da escola não pode exceder 300 caracteres.`)
    .optional()
    .default(''),
  tipo_trabalho: z
    .enum(['universitario', 'escolar', 'tecnico'], {
      error: () => ({ message: "Tipo deve ser: universitario, escolar ou tecnico" })
    })
    .optional()
    .default('universitario'),
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
    .default('nvidia/nemotron-3-ultra-550b-a55b:free'),
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
    .default('nvidia/nemotron-3-ultra-550b-a55b:free'),
});

// ─── /api/chat ───────────────────────────────────────────────
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_FILES = 5;
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

const fileSchema = z
  .object({
    name: z.string().max(255),
    type: z.string().refine((t) => ALLOWED_MIME.includes(t), {
      message: "Tipo de ficheiro não suportado. Apenas PNG, JPEG, WebP e PDF.",
    }),
    url: z.string().max(2048).optional(),
    data: z
      .string()
      .max(7 * 1024 * 1024, "Ficheiro excede 5MB (limite base64).")
      .optional(),
  })
  .refine((f) => Boolean(f.url) || Boolean(f.data), {
    message: "Ficheiro sem 'url' nem 'data'.",
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

// ─── /api/curriculo ──────────────────────────────────────────
export const curriculoSchema = z.object({
  nome_completo: z
    .string({ required_error: "Nome completo é obrigatório." })
    .min(2, "Nome completo deve ter pelo menos 2 caracteres.")
    .max(200, "Nome completo não pode exceder 200 caracteres.")
    .trim(),
  email: z.string().max(200).optional().default(''),
  telefone: z.string().max(50).optional().default(''),
  provincia: z.string().max(100).optional().default(''),
  Linkedin: z.string().max(500).optional().default(''),
  tipo_vaga: z.string().max(200).optional().default(''),
  empresa_alvo: z.string().max(200).optional().default(''),
  setor_empresa: z.string().max(200).optional().default(''),
  objetivo_profissional: z
    .string({ required_error: "Objetivo profissional é obrigatório." })
    .min(5, "Objetivo profissional deve ter pelo menos 5 caracteres.")
    .max(MAX_FIELD, `Objetivo profissional não pode exceder ${MAX_FIELD} caracteres.`)
    .trim(),
  nivel_educacao: z.string().max(100).optional().default(''),
  formacao: z.string().max(300).optional().default(''),
  instituicao: z.string().max(300).optional().default(''),
  ano_conclusao: z.string().max(20).optional().default(''),
  experiencia: z.string().max(MAX_FIELD).optional().default('Estudante'),
  habilidades: z
    .string({ required_error: "Habilidades/competências são obrigatórias." })
    .min(3, "Habilidades deve ter pelo menos 3 caracteres.")
    .max(MAX_FIELD, `Habilidades não pode exceder ${MAX_FIELD} caracteres.`)
    .trim(),
  idiomas: z.string().max(500).optional().default('Português (nativo)'),
  cursos_complementares: z.string().max(MAX_FIELD).optional().default(''),
  disponibilidade: z.string().max(200).optional().default('A combinar'),
  pretensao_salarial: z.string().max(200).optional().default('A combinar'),
  informacoes_adicionais: z.string().max(MAX_FIELD).optional().default(''),
});
