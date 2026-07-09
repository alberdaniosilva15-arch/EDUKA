import { NextResponse } from "next/server";
import { generateContent } from "@/lib/ai-provider";
import { buildExplainPrompt } from "@/lib/prompts";
import { sanitizeInput } from "@/lib/utils";
import { authenticateAndRateLimit, validateSchema } from "@/lib/api-helpers";
import { explainSchema } from "@/lib/api-schemas";

export async function POST(request) {
  try {
    // 1. Auth + Rate limit por user_id
    const { user, supabase, error: authError } = await authenticateAndRateLimit(request);
    if (authError) return authError;

    // 2. Parse + sanitizar + validar com Zod
    const raw = await request.json();
    const sanitized = {
      tema: sanitizeInput(raw.tema),
      nivel: sanitizeInput(raw.nivel),
    };
    const { valid, data, error: validationError } = validateSchema(explainSchema, sanitized);
    if (!valid) return validationError;

    // 3. Gerar conteúdo
    const prompt = buildExplainPrompt(data);
    const result = await generateContent(prompt);

    return NextResponse.json({ result, provider: "auto" });
  } catch (error) {
    console.error("[API /explain] Erro:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
