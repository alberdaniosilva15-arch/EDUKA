import { NextResponse } from "next/server";
import { generateContent, getProviderForModel } from "@/lib/ai";
import { buildSlidesPrompt, SLIDES_SYSTEM } from "@/lib/ai/prompts/slides";
import { slidesOutputSchema, repairSlides, scoreSlides } from "@/lib/ai/schemas/output";
import { evaluateSlidesQuality } from "@/lib/ai/quality/rubrics";
import { sanitizeInput } from "@/lib/utils";
import { authenticateAndRateLimit, validateSchema, withRateLimitHeaders } from "@/lib/api-helpers";
import { slidesSchema } from "@/lib/api-schemas";

function parseSlidesJson(rawResponse) {
  const cleanJson = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
  const start = cleanJson.indexOf("[");
  const end = cleanJson.lastIndexOf("]");
  const candidate = start >= 0 && end > start ? cleanJson.slice(start, end + 1) : cleanJson;
  return JSON.parse(candidate);
}

/**
 * Segunda chamada seletiva: apenas para reparar campos deficientes.
 * Não regenera tudo — pede apenas slides específicos com problemas.
 */
async function repairWithSecondCall(slides, issues, data, provider) {
  const repairPrompt = `
Tu és o Presentation Director da Eduka. Estes slides foram avaliados e têm problemas específicos.

## SLIDES ATUAIS
${JSON.stringify(slides, null, 2)}

## PROBLEMAS DETETADOS
${issues.map((issue, i) => `${i + 1}. ${issue}`).join("\n")}

## TAREFA
Corrige APENAS os campos problemáticos. Mantém todo o resto intacto.

## REGRAS
- Para cada slide com problema, corrige o campo específico
- Se keyMessage é vaga, torna-a específica e completa
- Se bullets são vagos, torna-os concretos (dados, exemplos)
- Se speakerNotes são curtas, expande para 80-180 palavras
- Se evidence é null mas deveria existir, adiciona um dado ou exemplo
- NÃO inventes referências. Marca dados não confirmados como "a confirmar"
- Retorna o array COMPLETO corrigido, não apenas os slides problemáticos
- JSON puro, sem markdown
`.trim();

  const result = await generateContent(repairPrompt, {
    provider,
    model: data.model,
    capability: "json",
    system: "Responde APENAS com JSON válido. Nada antes, nada depois.",
    temperature: 0.4,
    maxTokens: 8192,
  });

  return parseSlidesJson(result.text);
}

export async function POST(request) {
  try {
    // 1. Auth + Rate limit
    const { user, supabase, error: authError, rateLimit } = await authenticateAndRateLimit(request);
    if (authError) return authError;

    // 2. Parse + sanitizar + validar
    const raw = await request.json();
    const sanitized = {
      topic: sanitizeInput(raw.topic),
      numSlides: raw.numSlides,
      style: sanitizeInput(raw.style),
      model: raw.model || "meta-llama/llama-3.3-70b-instruct:free",
    };
    const { valid, data, error: validationError } = validateSchema(slidesSchema, sanitized);
    if (!valid) return validationError;

    // 3. Determinar provider
    const provider = getProviderForModel(data.model);

    // 4. Gerar conteúdo
    const prompt = buildSlidesPrompt(data);
    const result = await generateContent(prompt, {
      provider,
      model: data.model,
      capability: "json",
      system: "Responde APENAS com JSON válido. Nada antes, nada depois.",
      temperature: 0.55,
      maxTokens: 8192,
    });

    // 5. Parse
    let jsonContent;
    try {
      jsonContent = parseSlidesJson(result.text);
    } catch (parseError) {
      console.error("[Slides] JSON parse failed:", parseError.message);
      return NextResponse.json(
        { error: "A IA não conseguiu formatar os slides corretamente. Tenta novamente." },
        { status: 500 }
      );
    }

    // 6. Validar com Zod + repair determinístico
    const schemaResult = slidesOutputSchema.safeParse(jsonContent);
    if (!schemaResult.success) {
      jsonContent = repairSlides(jsonContent, data.numSlides);
    }

    // Garantir contagem correcta
    if (jsonContent.length > data.numSlides) {
      jsonContent = jsonContent.slice(0, data.numSlides);
    }
    while (jsonContent.length < data.numSlides) {
      const i = jsonContent.length;
      jsonContent.push({
        title: `Slide ${i + 1}`,
        purpose: "Compreender o conteúdo",
        keyMessage: "Conteúdo a definir",
        bullets: ["Ponto principal", "Ponto secundário"],
        evidence: null,
        localContext: null,
        visual: { type: "diagram", description: "Diagrama", caption: "Diagrama", alt: "Diagrama" },
        speakerNotes: "Notas do apresentador para este slide.",
        sourceHints: [],
      });
    }

    // 7. Avaliação de qualidade
    const quality = evaluateSlidesQuality(jsonContent);
    const scores = scoreSlides(jsonContent);

    // 8. Pós-processamento seletivo
    let postProcessed = false;
    let secondCallLatency = 0;
    let repairStart = Date.now();

    if (!quality.passed && quality.score >= 5 && quality.issues.length > 0) {
      // Reparável: segunda chamada para corrigir campos específicos
      console.log("[Slides] Reparando:", { issues: quality.issues.length, score: quality.score });
      repairStart = Date.now();
      try {
        const repaired = await repairWithSecondCall(jsonContent, quality.issues, data, provider);
        if (Array.isArray(repaired) && repaired.length === data.numSlides) {
          jsonContent = repaired;
          postProcessed = true;
          secondCallLatency = Date.now() - repairStart;
        }
      } catch (repairErr) {
        console.warn("[Slides] Repair failed, using original:", repairErr.message);
      }
    } else if (!quality.passed && quality.score < 5) {
      // Demasiado mau: regenerar completamente
      console.log("[Slides] Regenerando:", { score: quality.score });
      try {
        const result2 = await generateContent(prompt, {
          provider,
          model: data.model,
          capability: "json",
          system: "Responde APENAS com JSON válido. Nada antes, nada depois.",
          temperature: 0.6, // ligeiramente mais alto na 2ª tentativa
          maxTokens: 8192,
        });
        const repaired = parseSlidesJson(result2.text);
        const schemaResult2 = slidesOutputSchema.safeParse(repaired);
        if (schemaResult2.success) {
          jsonContent = repaired.slice(0, data.numSlides);
          postProcessed = true;
          secondCallLatency = Date.now() - repairStart;
        }
      } catch (regenErr) {
        console.warn("[Slides] Regen failed, using original:", regenErr.message);
      }
    }

    // Reavaliar após pós-processamento
    const finalScores = scoreSlides(jsonContent);
    const finalQuality = evaluateSlidesQuality(jsonContent);

    // 9. Telemetria
    const totalLatency = result.latencyMs + secondCallLatency;
    console.log("[Slides] Concluído:", {
      provider: result.provider,
      model: result.model,
      totalLatencyMs: totalLatency,
      qualityScore: finalScores.percentage,
      qualityPassed: finalQuality.passed,
      postProcessed,
      slidesCount: jsonContent.length,
      creditsUsed: rateLimit?.cost || 3,
    });

    const response = NextResponse.json({
      slides: jsonContent,
      meta: {
        provider: result.provider,
        model: result.model,
        latencyMs: totalLatency,
        postProcessed,
        quality: {
          score: finalScores.percentage,
          passed: finalQuality.passed,
          issues: finalQuality.issues,
          suggestions: finalQuality.suggestions,
        },
      },
    });

    return withRateLimitHeaders(response, rateLimit);
  } catch (error) {
    console.error("[Slides API] Erro:", error.message || error);
    const msg = error.message?.includes("autenticado")
      ? "Sessão expirada. Faz login novamente."
      : error.message?.includes("indisponíveis")
        ? "Serviço de IA temporariamente indisponível. Tenta novamente em alguns minutos."
        : "Ocorreu um erro ao gerar os slides. Tenta novamente.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
