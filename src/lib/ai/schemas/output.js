/**
 * Eduka — Output Schemas (Zod)
 * Validação de saída da IA antes de enviar ao frontend.
 */
import { z } from "zod";

// ─── Slide output schema ───────────────────────────────────

const evidenceSchema = z.object({
  type: z.enum(["dado", "exemplo", "caso", "estudo"]),
  text: z.string().min(1),
  source: z.string().min(1),
});

const localContextSchema = z.object({
  text: z.string().min(1),
  relevance: z.enum(["alto", "médio"]),
});

const visualSchema = z.object({
  type: z.enum(["photo", "diagram", "chart", "timeline", "map", "icon"]),
  description: z.string().min(1),
  caption: z.string().min(1),
  alt: z.string().min(1),
});

export const slideOutputSchema = z.object({
  title: z.string().min(1).max(90),
  purpose: z.string().min(1).max(200),
  keyMessage: z.string().min(10).max(300),
  bullets: z.array(z.string().min(1).max(100)).min(2).max(4),
  evidence: evidenceSchema.nullable(),
  localContext: localContextSchema.nullable(),
  visual: visualSchema,
  speakerNotes: z.string().min(30).max(800),
  sourceHints: z.array(z.string()),
});

export const slidesOutputSchema = z.array(slideOutputSchema).min(3).max(25);

// ─── Work output schema ────────────────────────────────────

export const workOutputSchema = z.object({
  title: z.string().min(3).max(200),
  centralQuestion: z.string().min(10).max(500),
  thesis: z.string().min(10).max(500),
  introduction: z.string().min(100),
  development: z.string().min(200),
  counterpoint: z.string().min(50),
  conclusion: z.string().min(100),
  references: z.array(z.string().min(1)),
});

// ─── Repair functions ──────────────────────────────────────

/**
 * Repara slides inválidos de forma determinística.
 * Não regenera — apenas corrige campos ausentes ou malformados.
 */
export function repairSlide(slide, index) {
  if (!slide || typeof slide !== "object") slide = {};
  return {
    title: slide.title || `Slide ${index + 1}`,
    purpose: slide.purpose || "Compreender o conteúdo deste slide",
    keyMessage: slide.keyMessage || slide.title || `Conteúdo do slide ${index + 1}`,
    bullets: Array.isArray(slide.bullets) && slide.bullets.length >= 2
      ? slide.bullets.slice(0, 4)
      : ["Ponto principal", "Ponto secundário"],
    evidence: slide.evidence || null,
    localContext: slide.localContext || null,
    visual: slide.visual || {
      type: "diagram",
      description: slide.title || "Diagrama",
      caption: slide.title || "Diagrama",
      alt: slide.title || "Diagrama ilustrativo",
    },
    speakerNotes: slide.speakerNotes || slide.notes || `Notas do apresentador para o slide ${index + 1}.`,
    sourceHints: Array.isArray(slide.sourceHints) ? slide.sourceHints : [],
  };
}

/**
 * Repara um array de slides: garante contagem e validade de cada slide.
 */
export function repairSlides(slides, expectedCount) {
  let slidesArray = [];
  if (Array.isArray(slides)) {
    slidesArray = slides;
  } else if (slides && Array.isArray(slides.slides)) {
    slidesArray = slides.slides;
  } else if (slides && typeof slides === "object") {
    slidesArray = [slides];
  }

  let repaired = slidesArray.map((s, i) => repairSlide(s, i));

  // Truncar se exceder
  if (repaired.length > expectedCount) {
    repaired = repaired.slice(0, expectedCount);
  }

  // Completar se faltarem
  while (repaired.length < expectedCount) {
    const i = repaired.length;
    repaired.push(repairSlide({}, i));
  }

  return repaired;
}

/**
 * Repara trabalho académico de forma determinística.
 */
export function repairWork(work) {
  return {
    title: work.title || "Trabalho Académico",
    centralQuestion: work.centralQuestion || "Pergunta central não definida",
    thesis: work.thesis || "Tese não definida",
    introduction: work.introduction || "Introdução não disponível.",
    development: work.development || "Desenvolvimento não disponível.",
    counterpoint: work.counterpoint || "Contraponto não disponível.",
    conclusion: work.conclusion || "Conclusão não disponível.",
    references: Array.isArray(work.references) ? work.references : [],
  };
}

// ─── Quality scoring ───────────────────────────────────────

/**
 * Avalia um slide individual e retorna pontuação 0-2 por critério.
 */
export function scoreSlide(slide) {
  const scores = {
    titleSpecificity: 0,
    keyMessageClarity: 0,
    bulletQuality: 0,
    speakerNotesDepth: 0,
    hasEvidence: 0,
    hasLocalContext: 0,
  };

  // Título específico (não genérico)
  const genericTitles = ["introdução", "conclusão", "resumo", "slide", "índice"];
  if (slide.title && slide.title.length > 5 && !genericTitles.some(g => slide.title.toLowerCase().includes(g))) {
    scores.titleSpecificity = 2;
  } else if (slide.title && slide.title.length > 3) {
    scores.titleSpecificity = 1;
  }

  // Key message clara
  if (slide.keyMessage && slide.keyMessage.length > 20) {
    scores.keyMessageClarity = 2;
  } else if (slide.keyMessage && slide.keyMessage.length > 10) {
    scores.keyMessageClarity = 1;
  }

  // Qualidade dos bullets
  if (slide.bullets && slide.bullets.length >= 2 && slide.bullets.length <= 4) {
    const hasConcrete = slide.bullets.some(b => b.length > 15);
    scores.bulletQuality = hasConcrete ? 2 : 1;
  }

  // Profundidade das notas
  if (slide.speakerNotes) {
    const wordCount = slide.speakerNotes.split(/\s+/).length;
    if (wordCount >= 80) scores.speakerNotesDepth = 2;
    else if (wordCount >= 30) scores.speakerNotesDepth = 1;
  }

  // Evidence
  if (slide.evidence) scores.hasEvidence = 2;

  // Local context
  if (slide.localContext) scores.hasLocalContext = 2;

  return scores;
}

/**
 * Avalia um conjunto de slides e retorna pontuação total e status.
 */
export function scoreSlides(slides) {
  let totalScore = 0;
  let maxScore = 0;
  const details = [];

  for (let i = 0; i < slides.length; i++) {
    const scores = scoreSlide(slides[i]);
    const slideTotal = Object.values(scores).reduce((a, b) => a + b, 0);
    const slideMax = Object.keys(scores).length * 2;
    totalScore += slideTotal;
    maxScore += slideMax;
    details.push({ index: i, title: slides[i].title, scores, total: slideTotal });
  }

  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  const hasLocalContext = slides.some(s => s.localContext);
  const hasEvidence = slides.filter(s => s.evidence).length;

  return {
    totalScore,
    maxScore,
    percentage: Math.round(percentage),
    passed: percentage >= 60 && hasLocalContext && hasEvidence >= 1,
    details,
    hasLocalContext,
    evidenceCount: hasEvidence,
  };
}

/**
 * Avalia trabalho académico e retorna pontuação.
 */
export function scoreWork(work) {
  const scores = {
    thesisClarity: 0,
    structureCoherence: 0,
    evidenceAndExamples: 0,
    criticalThinking: 0,
    levelAdequacy: 0,
    localContext: 0,
    sourcePolicy: "aprovado",
  };

  // Clareza da tese
  if (work.thesis && work.thesis.length > 20) scores.thesisClarity = 2;
  else if (work.thesis && work.thesis.length > 10) scores.thesisClarity = 1;

  // Coerência estrutural
  if (work.introduction && work.development && work.conclusion && work.counterpoint) {
    scores.structureCoherence = 2;
  } else if (work.introduction && work.development && work.conclusion) {
    scores.structureCoherence = 1;
  }

  // Evidências (heurística: verificar se há dados, casos ou exemplos)
  const combinedText = [work.development, work.introduction, work.counterpoint].join(" ");
  const hasNumbers = /\d+[%\$]|\d{4}|segundo|de acordo|estudo|pesquisa/i.test(combinedText);
  const hasCases = /caso|exemplo|estudo de caso|aplicação/i.test(combinedText);
  if (hasNumbers && hasCases) scores.evidenceAndExamples = 2;
  else if (hasNumbers || hasCases) scores.evidenceAndExamples = 1;

  // Pensamento crítico
  if (work.counterpoint && work.counterpoint.length > 50) scores.criticalThinking = 2;
  else if (work.counterpoint && work.counterpoint.length > 20) scores.criticalThinking = 1;

  // Adequação ao nível (heurística)
  scores.levelAdequacy = 1; // Assume aceitável; validação manual para refinamento

  // Contexto local
  const localTerms = /angola|luanda|angolano|africano|lusófono|africa|cilra|bndra|INE|MINEDU/i;
  if (localTerms.test(combinedText)) scores.localContext = 2;

  // Política de fontes
  const hasInventedDoi = /10\.\d{4,}\/[^\s]+/i.test(combinedText);
  const hasSuspiciousRef = /\[a confirmar\]/i.test(combinedText);
  if (hasInventedDoi) scores.sourcePolicy = "reprovado";

  const total = Object.entries(scores)
    .filter(([k]) => k !== "sourcePolicy")
    .reduce((sum, [, v]) => sum + v, 0);
  const max = 12;

  return {
    scores,
    total,
    max,
    percentage: Math.round((total / max) * 100),
    passed: total >= 8 && scores.sourcePolicy === "aprovado",
  };
}
