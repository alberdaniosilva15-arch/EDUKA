import { NextResponse } from "next/server";
import { generateContent } from "@/lib/ai";
import { buildWorkPrompt, WORK_RUBRIC } from "@/lib/ai/prompts/work";
import { WORK_SYSTEM } from "@/lib/ai/systems/work";
import { scoreWork } from "@/lib/ai/schemas/output";
import { evaluateWorkQuality } from "@/lib/ai/quality/rubrics";
import { sanitizeInput } from "@/lib/utils";
import { authenticateAndRateLimit, validateSchema, withRateLimitHeaders } from "@/lib/api-helpers";
import { generateSchema } from "@/lib/api-schemas";

/**
 * Tenta extrair seções estruturadas do texto livre.
 * O modelo pode devolver markdown puro — esta função tenta parsing.
 */
function parseWorkSections(text) {
  const sections = {
    title: "",
    centralQuestion: "",
    thesis: "",
    introduction: "",
    development: "",
    counterpoint: "",
    conclusion: "",
    references: [],
  };

  if (!text) return sections;

  // Tentar extrair título (primeira linha #)
  const titleMatch = text.match(/^#\s+(.+)$/m);
  if (titleMatch) sections.title = titleMatch[1].trim();

  // Extrair seções por marcadores
  const sectionPatterns = [
    { key: "centralQuestion", pattern: /(?:pergunta\s+central|questão\s+central|problemática)[:\s]*\n(.+?)(?=\n##|\n\*\*|\n#|$)/is },
    { key: "thesis", pattern: /(?:tese|afirmação\s+central)[:\s]*\n(.+?)(?=\n##|\n\*\*|\n#|$)/is },
    { key: "introduction", pattern: /(?:##\s*introdução|##\s*1[.\s]*introdução)(.+?)(?=##\s*(?:desenvolvimento|corpo|discussão)|##\s*2[.\s]|$)/is },
    { key: "development", pattern: /(?:##\s*(?:desenvolvimento|corpo|discussão)|##\s*2[.\s]*desenvolvimento)(.+?)(?=##\s*(?:contraponto|limitação|conclusão)|##\s*3[.\s]|$)/is },
    { key: "counterpoint", pattern: /(?:##\s*(?:contraponto|limitação|perspectiva)|##\s*3[.\s]*(?:contraponto|limitação))(.+?)(?=##\s*conclusão|##\s*4[.\s]|$)/is },
    { key: "conclusion", pattern: /(?:##\s*conclusão)(.+?)(?=##\s*referência|##\s*referências|$)/is },
  ];

  for (const { key, pattern } of sectionPatterns) {
    const match = text.match(pattern);
    if (match) sections[key] = match[1].trim();
  }

  // Extrair referências
  const refSection = text.match(/(?:##\s*referências?)([\s\S]*?)$/i);
  if (refSection) {
    const refs = refSection[1]
      .split(/\n/)
      .filter((line) => line.trim().match(/^[-*]\s+|^\d+\.\s+/))
      .map((line) => line.replace(/^[-*]\s+|^\d+\.\s+/, "").trim())
      .filter(Boolean);
    sections.references = refs;
  }

  // Se não conseguiu extrair seções, usar o texto inteiro como desenvolvimento
  if (!sections.introduction && !sections.development) {
    sections.development = text;
  }

  return sections;
}

export async function POST(request) {
  try {
    // 1. Auth + Rate limit
    const { user, supabase, error: authError, rateLimit } = await authenticateAndRateLimit(request);
    if (authError) return authError;

    // 2. Parse + sanitizar + validar
    const raw = await request.json();
    const sanitized = {
      tema: sanitizeInput(raw.tema),
      curso: sanitizeInput(raw.curso),
      nivel: sanitizeInput(raw.nivel),
      paginas: sanitizeInput(raw.paginas),
      requisitos: sanitizeInput(raw.requisitos),
      // Campos escolares
      nomes_alunos: sanitizeInput(raw.nomes_alunos),
      turma: sanitizeInput(raw.turma),
      professor: sanitizeInput(raw.professor),
      disciplina: sanitizeInput(raw.disciplina),
      escola: sanitizeInput(raw.escola),
      tipo_trabalho: raw.tipo_trabalho || 'universitario',
    };
    const { valid, data, error: validationError } = validateSchema(generateSchema, sanitized);
    if (!valid) return validationError;

    // 3. Gerar conteúdo - priorizar Groq para velocidade
    const prompt = buildWorkPrompt(data);
    const result = await generateContent(prompt, {
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      capability: "text",
      system: WORK_SYSTEM,
      temperature: 0.62,
      maxTokens: 8192,
    });

    // 4. Parse seções do trabalho
    const sections = parseWorkSections(result.text);

    // 5. Avaliar qualidade
    const quality = evaluateWorkQuality(sections);
    const scores = scoreWork(sections);

    // 6. Pós-processamento seletivo
    let postProcessed = false;
    let secondCallLatency = 0;

    if (!quality.passed && quality.score >= 5 && quality.issues.length > 0) {
      // Segunda chamada para expandir seções deficientes
      console.log("[Generate] Expandindo seções:", { issues: quality.issues.length });
      const repairStart = Date.now();

      const expandPrompt = `
Tu és o AcademicWork Director da Eduka. O trabalho abaixo foi avaliado e tem seções deficientes.

## TRABALHO ATUAL
${result.text}

## SEÇÕES COM PROBLEMAS
${quality.issues.map((issue, i) => `${i + 1}. ${issue}`).join("\n")}

## TAREFA
Expande APENAS as seções mencionadas. Mantém o resto intacto.
- Se falta contraponto, adiciona uma secção com perspectivas alternativas
- Se referências são poucas, adiciona 2-3 fontes credíveis (NUNCA inventar DOI)
- Se desenvolvimento é curto, expande com mais argumentos e exemplos
- Mantém a voz e estrutura original

Retorna o trabalho completo em Markdown.
`.trim();

      try {
        const result2 = await generateContent(expandPrompt, {
          provider: "openrouter",
          model: "nvidia/nemotron-3-ultra-550b-a55b:free",
          capability: "text",
          temperature: 0.62,
          maxTokens: 8192,
        });
        const expandedSections = parseWorkSections(result2.text);

        // Usar expansão apenas se melhorou
        const expandedQuality = evaluateWorkQuality(expandedSections);
        if (expandedQuality.score > quality.score) {
          Object.assign(sections, expandedSections);
          postProcessed = true;
        }
        secondCallLatency = Date.now() - repairStart;
      } catch (expandErr) {
        console.warn("[Generate] Expand failed:", expandErr.message);
      }
    }

    // Reavaliar
    const finalQuality = evaluateWorkQuality(sections);
    const finalScores = scoreWork(sections);

    // 7. Telemetria
    const totalLatency = result.latencyMs + secondCallLatency;
    console.log("[Generate] Concluído:", {
      provider: result.provider,
      model: result.model,
      totalLatencyMs: totalLatency,
      qualityScore: finalScores.percentage,
      qualityPassed: finalQuality.passed,
      postProcessed,
      responseLength: result.text?.length || 0,
      creditsUsed: rateLimit?.cost || 3,
    });

    const response = NextResponse.json({
      result: result.text,
      meta: {
        provider: result.provider,
        model: result.model,
        latencyMs: totalLatency,
        postProcessed,
        quality: {
          score: finalScores.percentage,
          passed: finalQuality.passed,
          issues: finalQuality.issues,
        },
      },
    });

    return withRateLimitHeaders(response, rateLimit);
  } catch (error) {
    console.error("[API /generate] Erro:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
