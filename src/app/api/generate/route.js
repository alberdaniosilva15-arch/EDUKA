import { NextResponse } from "next/server";
import { generateContent } from "@/lib/ai-provider";
import { buildPremiumWorkPrompt } from "@/lib/quality-prompts";
import { sanitizeInput } from "@/lib/utils";
import { authenticateAndRateLimit, validateSchema } from "@/lib/api-helpers";
import { generateSchema } from "@/lib/api-schemas";

export async function POST(request) {
  try {
    // 1. Auth + Rate limit por user_id
    const { user, supabase, error: authError } = await authenticateAndRateLimit(request);
    if (authError) return authError;

    // 2. Parse + sanitizar + validar com Zod
    const raw = await request.json();
    const sanitized = {
      tema: sanitizeInput(raw.tema),
      curso: sanitizeInput(raw.curso),
      nivel: sanitizeInput(raw.nivel),
      paginas: sanitizeInput(raw.paginas),
      requisitos: sanitizeInput(raw.requisitos),
    };
    const { valid, data, error: validationError } = validateSchema(generateSchema, sanitized);
    if (!valid) return validationError;

    // 3. Gerar conteúdo
    const prompt = buildPremiumWorkPrompt(data);
    const result = await generateContent(prompt, {
      provider: "openrouter",
      model: "meta-llama/llama-3.3-70b-instruct:free",
      system: "Es um diretor academico da Eduka. Usa pesquisa e exemplos reais quando disponiveis; se nao houver certeza, marca como a confirmar.",
      temperature: 0.62,
      maxTokens: 8192,
    });

    return NextResponse.json({ result, provider: "openrouter" });
  } catch (error) {
    console.error("[API /generate] Erro:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
