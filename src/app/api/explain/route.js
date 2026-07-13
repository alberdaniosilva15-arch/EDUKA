import { NextResponse } from "next/server";
import { generateContent } from "@/lib/ai";
import { buildExplainPrompt } from "@/lib/ai/prompts/explain";
import { EXPLAIN_SYSTEM } from "@/lib/ai/systems/explain";
import { sanitizeInput } from "@/lib/utils";
import { authenticateAndRateLimit, validateSchema, withRateLimitHeaders } from "@/lib/api-helpers";
import { explainSchema } from "@/lib/api-schemas";

export async function POST(request) {
  try {
    // 1. Auth + Rate limit
    const { user, supabase, error: authError, rateLimit } = await authenticateAndRateLimit(request);
    if (authError) return authError;

    // 2. Parse + sanitizar + validar
    const raw = await request.json();
    const sanitized = {
      tema: sanitizeInput(raw.tema),
      nivel: sanitizeInput(raw.nivel),
    };
    const { valid, data, error: validationError } = validateSchema(explainSchema, sanitized);
    if (!valid) return validationError;

    // 3. Gerar conteúdo
    const prompt = buildExplainPrompt(data);
    const result = await generateContent(prompt, {
      provider: "openrouter",
      system: EXPLAIN_SYSTEM,
      temperature: 0.65,
      maxTokens: 4096,
    });

    // 4. Telemetria
    console.log("[Explain] Gerado:", {
      provider: result.provider,
      model: result.model,
      latencyMs: result.latencyMs,
      creditsUsed: rateLimit?.cost || 1,
    });

    const response = NextResponse.json({
      result: result.text,
      meta: {
        provider: result.provider,
        model: result.model,
        latencyMs: result.latencyMs,
      },
    });

    return withRateLimitHeaders(response, rateLimit);
  } catch (error) {
    console.error("[API /explain] Erro:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
