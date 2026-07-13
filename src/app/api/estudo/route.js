import { NextResponse } from "next/server";
import { generateContent, getProviderForModel } from "@/lib/ai";
import { buildStudyPrompt } from "@/lib/ai/prompts/study";
import { STUDY_SYSTEM } from "@/lib/ai/systems/study";
import { sanitizeInput } from "@/lib/utils";
import { authenticateAndRateLimit, validateSchema, withRateLimitHeaders } from "@/lib/api-helpers";
import { estudoSchema } from "@/lib/api-schemas";

export async function POST(request) {
  try {
    // 1. Auth + Rate limit
    const { user, supabase, error: authError, rateLimit } = await authenticateAndRateLimit(request);
    if (authError) return authError;

    // 2. Parse + sanitizar + validar
    const raw = await request.json();
    const sanitized = {
      topic: sanitizeInput(raw.topic),
      timeframe: sanitizeInput(raw.timeframe),
      course: sanitizeInput(raw.course),
      difficulty: sanitizeInput(raw.difficulty),
      model: raw.model || "meta-llama/llama-3.3-70b-instruct:free",
    };
    const { valid, data, error: validationError } = validateSchema(estudoSchema, sanitized);
    if (!valid) return validationError;

    // 3. Gerar conteúdo
    const prompt = buildStudyPrompt(data);
    const provider = getProviderForModel(data.model);
    const result = await generateContent(prompt, {
      provider,
      model: data.model,
      system: STUDY_SYSTEM,
      temperature: 0.65,
      maxTokens: 8192,
    });

    // 4. Telemetria
    console.log("[Estudo] Gerado:", {
      provider: result.provider,
      model: result.model,
      latencyMs: result.latencyMs,
      creditsUsed: rateLimit?.cost || 2,
    });

    const response = NextResponse.json({
      markdown: result.text,
      meta: {
        provider: result.provider,
        model: result.model,
        latencyMs: result.latencyMs,
      },
    });

    return withRateLimitHeaders(response, rateLimit);
  } catch (error) {
    console.error("[Estudo API] Erro:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro ao gerar o plano de estudo." },
      { status: 500 }
    );
  }
}
