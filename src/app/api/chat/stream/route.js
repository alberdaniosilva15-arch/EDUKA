import { NextResponse } from "next/server";
import { authenticateAndRateLimit, validateSchema, withRateLimitHeaders } from "@/lib/api-helpers";
import { chatSchema } from "@/lib/api-schemas";
import { FREE_MODELS, isVisionModel, getProviderForModel } from "@/lib/free-models";
import { CHAT_SYSTEM } from "@/lib/ai/systems/chat";
import { sanitizeInput } from "@/lib/utils";
import { generateContentStream } from "@/lib/ai/streaming";

function isFreeModel(modelId) {
  return FREE_MODELS.some((m) => m.id === modelId);
}

/**
 * POST /api/chat/stream — Chat com streaming via SSE
 */
export async function POST(request) {
  try {
    const { user, error: authError, rateLimit } = await authenticateAndRateLimit(request);
    if (authError) return authError;

    const raw = await request.json();
    const modelId = raw.model || FREE_MODELS[0].id;

    const sanitized = {
      model: isFreeModel(modelId) ? modelId : FREE_MODELS[0].id,
      messages: Array.isArray(raw.messages)
        ? raw.messages.map((message) => ({
            role: message.role,
            content: sanitizeInput(message.content || ""),
          }))
        : [],
      files: [],
    };

    const { valid, data, error: validationError } = validateSchema(chatSchema, sanitized);
    if (!valid) return validationError;

    const messages = data.messages.slice(-20);
    const provider = getProviderForModel(data.model);

    // Construir prompt com histórico
    const historyText = messages
      .map((m) => `${m.role === "user" ? "Aluno" : "Eduka"}: ${m.content}`)
      .join("\n\n");
    const lastUserMsg = messages.filter((m) => m.role === "user").pop()?.content || "";

    const prompt = historyText;

    const { stream } = await generateContentStream(prompt, {
      provider,
      model: data.model,
      system: CHAT_SYSTEM,
      temperature: 0.72,
      maxTokens: 4096,
    });

    console.log("[Chat Stream] Iniciado:", { user: user.id, model: data.model });

    return withRateLimitHeaders(new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    }), rateLimit);
  } catch (error) {
    console.error("[API /chat/stream] Erro:", error);
    return NextResponse.json({ error: error.message || "Erro ao conversar com a IA." }, { status: 500 });
  }
}
