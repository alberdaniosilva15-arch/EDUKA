import { NextResponse } from "next/server";
import { generateContent } from "@/lib/ai";
import { buildImprovePrompt } from "@/lib/ai/prompts/improve";
import { IMPROVE_SYSTEM } from "@/lib/ai/systems/improve";
import { sanitizeInput } from "@/lib/utils";
import { authenticateAndRateLimit, validateSchema, withRateLimitHeaders } from "@/lib/api-helpers";
import { improveSchema } from "@/lib/api-schemas";

export async function POST(request) {
  try {
    // 1. Auth + Rate limit
    const { user, supabase, error: authError, rateLimit } = await authenticateAndRateLimit(request);
    if (authError) return authError;

    // 2. Parse + sanitizar + validar
    const raw = await request.json();
    const sanitized = {
      texto: sanitizeInput(raw.texto),
      tipo: sanitizeInput(raw.tipo),
    };
    const { valid, data, error: validationError } = validateSchema(improveSchema, sanitized);
    if (!valid) return validationError;

    // 3. Gerar conteúdo
    const prompt = buildImprovePrompt(data);
    const result = await generateContent(prompt, {
      provider: "openrouter",
      system: IMPROVE_SYSTEM,
      temperature: 0.55,
      maxTokens: 4096,
    });

    // 4. Telemetria
    console.log("[Improve] Gerado:", {
      provider: result.provider,
      model: result.model,
      latencyMs: result.latencyMs,
      mode: data.tipo,
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
    console.error("[API /improve] Erro:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
