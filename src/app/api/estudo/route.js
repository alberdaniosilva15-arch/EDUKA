import { NextResponse } from "next/server";
import { generateContent } from "@/lib/ai-provider";
import { buildStudyPrompt } from "@/lib/prompts";
import { sanitizeInput } from "@/lib/utils";
import { authenticateAndRateLimit, validateSchema } from "@/lib/api-helpers";
import { estudoSchema } from "@/lib/api-schemas";
import { getProviderForModel } from "@/lib/free-models";

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
      model: raw.model || "meta-llama/llama-3.3-70b-instruct:free",
    };
    const { valid, data, error: validationError } = validateSchema(estudoSchema, sanitized);
    if (!valid) return validationError;

    // 3. Gerar conteudo com provider correto
    const prompt = buildStudyPrompt(data);
    const provider = getProviderForModel(data.model);
    const markdownResponse = await generateContent(prompt, {
      provider,
      model: data.model,
      temperature: 0.65,
      maxTokens: 8192,
    });

    return NextResponse.json({ markdown: markdownResponse });

  } catch (error) {
    console.error("Study Plan API Error:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro ao gerar o plano de estudo." },
      { status: 500 }
    );
  }
}
