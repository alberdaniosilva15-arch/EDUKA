import { NextResponse } from "next/server";
import { authenticateAndRateLimit } from "@/lib/api-helpers";
import { generateSchema } from "@/lib/api-schemas";
import { validateSchema, withRateLimitHeaders } from "@/lib/api-helpers";
import { buildWorkPrompt } from "@/lib/ai/prompts/work";
import { generateContentStream } from "@/lib/ai/streaming";
import { sanitizeInput } from "@/lib/utils";

/**
 * POST /api/generate/stream — Gera trabalho académico com streaming
 * Retorna Server-Sent Events (text/event-stream)
 */
export async function POST(request) {
  try {
    // 1. Auth + Rate limit
    const { user, error: authError, rateLimit } = await authenticateAndRateLimit(request);
    if (authError) return authError;

    // 2. Parse + sanitizar + validar
    const raw = await request.json();
    const sanitized = {
      tema: sanitizeInput(raw.tema),
      curso: sanitizeInput(raw.curso),
      nivel: sanitizeInput(raw.nivel),
      paginas: sanitizeInput(raw.paginas),
      requisitos: sanitizeInput(raw.requisitos),
      nomes_alunos: sanitizeInput(raw.nomes_alunos || ''),
      turma: sanitizeInput(raw.turma || ''),
      professor: sanitizeInput(raw.professor || ''),
      disciplina: sanitizeInput(raw.disciplina || ''),
      escola: sanitizeInput(raw.escola || ''),
      tipo_trabalho: sanitizeInput(raw.tipo_trabalho || 'universitario'),
    };
    const { valid, data, error: validationError } = validateSchema(generateSchema, sanitized);
    if (!valid) return validationError;

    // 3. Gerar prompt
    const prompt = buildWorkPrompt(data);

    // 4. Streaming
    const { stream, fullText } = await generateContentStream(prompt, {
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      capability: "text",
      system: "Es um diretor académico da Eduka. Usa pesquisa e exemplos reais quando disponíveis; se não houver certeza, marca como a confirmar.",
      temperature: 0.62,
      maxTokens: 8192,
    });

    console.log("[Generate Stream] Iniciado:", { user: user.id });

    // Retornar como SSE
    return withRateLimitHeaders(new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    }), rateLimit);
  } catch (error) {
    console.error("[API /generate/stream] Erro:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
