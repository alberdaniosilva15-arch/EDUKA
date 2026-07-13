import { NextResponse } from "next/server";
import { authenticateAndRateLimit, validateSchema } from "@/lib/api-helpers";
import { chatSchema } from "@/lib/api-schemas";
import { callGroqMessages, callOpenRouterMessages, callGeminiVision, callOpenRouterVision, callNvidiaMessages } from "@/lib/ai-provider";
import { FREE_MODELS, isVisionModel, getProviderForModel } from "@/lib/free-models";
import { CHAT_SYSTEM } from "@/lib/ai/systems/chat";
import { sanitizeInput } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

function isFreeModel(modelId) {
  return FREE_MODELS.some((m) => m.id === modelId);
}

function hasVisualFiles(files) {
  if (!files || files.length === 0) return false;
  return files.some((f) =>
    f.type?.startsWith("image/") || f.type === "application/pdf"
  );
}

/**
 * Guarda mensagem no Supabase se conversation_id for fornecido.
 */
async function saveMessage(supabase, conversationId, role, content, meta = {}) {
  if (!conversationId || !supabase) return;
  try {
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      role,
      content,
      model: meta.model || null,
      provider: meta.provider || null,
      latency_ms: meta.latencyMs || null,
    });
  } catch (err) {
    console.warn("[Chat] Save message failed:", err.message);
  }
}

export async function POST(request) {
  const startTime = Date.now();
  let provider = "unknown";
  let model = "unknown";

  try {
    const { user, supabase, error: authError, rateLimit } = await authenticateAndRateLimit(request);
    if (authError) return authError;

    const raw = await request.json();
    const modelId = raw.model || FREE_MODELS[0].id;
    const conversationId = raw.conversation_id || null;

    const rawFiles = Array.isArray(raw.files) ? raw.files : [];

    const sanitized = {
      model: isFreeModel(modelId) ? modelId : FREE_MODELS[0].id,
      messages: Array.isArray(raw.messages)
        ? raw.messages.map((message) => ({
            role: message.role,
            content: sanitizeInput(message.content || ""),
          }))
        : [],
      files: rawFiles.map((f) => ({
        name: String(f.name || "file").slice(0, 255),
        type: String(f.type || ""),
        data: String(f.data || ""),
      })),
    };

    const { valid, data, error: validationError } = validateSchema(chatSchema, sanitized);
    if (!valid) return validationError;

    const messages = data.messages.slice(-20);
    const files = data.files || [];
    const hasVisionFiles = hasVisualFiles(files);
    const hasPdf = files.some((f) => f.type === "application/pdf");

    provider = getProviderForModel(data.model);
    model = data.model;
    let content;

    // ── SE TEM FICHEIROS VISUAIS ──
    if (hasVisionFiles) {
      const effectiveProvider = (hasPdf && provider !== "gemini") ? "gemini" : provider;
      provider = effectiveProvider;
      const visionModel = (effectiveProvider === "gemini") ? "gemini-2.0-flash"
        : isVisionModel(data.model) ? data.model : "google/gemma-4-31b-it:free";
      model = visionModel;

      const imageData = [];
      for (const file of files) {
        if (file.type?.startsWith("image/") && file.data) {
          if (effectiveProvider === "gemini") {
            const base64Data = file.data.includes("base64,") ? file.data.split("base64,")[1] : file.data;
            imageData.push({ inlineData: { mimeType: file.type, data: base64Data } });
          } else {
            imageData.push(file.data);
          }
        } else if (file.type === "application/pdf" && file.data) {
          if (effectiveProvider === "gemini") {
            const base64Data = file.data.includes("base64,") ? file.data.split("base64,")[1] : file.data;
            imageData.push({ inlineData: { mimeType: "application/pdf", data: base64Data } });
          }
        }
      }

      if (imageData.length === 0) {
        content = await callOpenRouterMessages(messages, { model: data.model, system: CHAT_SYSTEM });
      } else if (effectiveProvider === "gemini") {
        content = await callGeminiVision(messages, imageData, {
          model: visionModel, system: CHAT_SYSTEM, temperature: 0.72, maxTokens: 4096,
        });
      } else {
        content = await callOpenRouterVision(messages, imageData, {
          model: visionModel, system: CHAT_SYSTEM, temperature: 0.72, maxTokens: 4096,
        });
      }
    }
    // ── SEM FICHEIROS ──
    else {
      if (provider === "openrouter") {
        content = await callOpenRouterMessages(messages, { model: data.model, system: CHAT_SYSTEM, temperature: 0.72, maxTokens: 4096 });
      } else if (provider === "gemini") {
        content = await callGeminiVision(messages, [], { model: data.model, system: CHAT_SYSTEM, temperature: 0.72, maxTokens: 4096 });
      } else if (provider === "nvidia") {
        content = await callNvidiaMessages(messages, { model: data.model, system: CHAT_SYSTEM, temperature: 0.72, maxTokens: 4096 });
      } else {
        content = await callGroqMessages(messages, { model: data.model, system: CHAT_SYSTEM, temperature: 0.72, maxTokens: 4096 });
      }
    }

    const latencyMs = Date.now() - startTime;

    // ── GUARDAR NO SUPABASE ──
    if (conversationId) {
      const supabaseClient = await createClient();
      // Guardar mensagem do utilizador (última)
      const lastUserMsg = messages.filter(m => m.role === "user").pop();
      if (lastUserMsg) {
        await saveMessage(supabaseClient, conversationId, "user", lastUserMsg.content);
      }
      // Guardar resposta da IA
      await saveMessage(supabaseClient, conversationId, "assistant", content, {
        model, provider, latencyMs,
      });
    }

    console.log("[Chat] Respondido:", { provider, model, latencyMs, messages: messages.length, conversationId });

    return NextResponse.json({
      message: { role: "assistant", content },
      model: data.model,
      meta: { provider, model, latencyMs },
    });
  } catch (error) {
    console.error("[API /chat] Erro:", error);
    return NextResponse.json({ error: error.message || "Erro ao conversar com a IA." }, { status: 500 });
  }
}
