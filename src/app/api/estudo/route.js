import { NextResponse } from "next/server";
import { generateContent } from "@/lib/ai-provider";
import { buildStudyPrompt } from "@/lib/prompts";
import { sanitizeInput } from "@/lib/utils";
import { authenticateAndRateLimit, validateSchema } from "@/lib/api-helpers";
import { estudoSchema } from "@/lib/api-schemas";

export async function POST(request) {
  try {
    // 1. Auth + Rate limit por user_id
    const { user, supabase, error: authError } = await authenticateAndRateLimit(request);
    if (authError) return authError;

    // 2. Parse + sanitizar + validar com Zod
    const raw = await request.json();
    const sanitized = {
      topic: sanitizeInput(raw.topic),
      timeframe: sanitizeInput(raw.timeframe),
      course: sanitizeInput(raw.course),
      difficulty: sanitizeInput(raw.difficulty),
    };
    const { valid, data, error: validationError } = validateSchema(estudoSchema, sanitized);
    if (!valid) return validationError;

    // 3. Gerar conteúdo
    const prompt = buildStudyPrompt(data);
    const markdownResponse = await generateContent(prompt);
    
    return NextResponse.json({ markdown: markdownResponse });

  } catch (error) {
    console.error("Study Plan API Error:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro ao gerar o plano de estudo." },
      { status: 500 }
    );
  }
}
