import { NextResponse } from "next/server";
import { authenticateAndRateLimit, validateSchema } from "@/lib/api-helpers";
import { chatSchema } from "@/lib/api-schemas";
import { generateContent, callVision, getProviderForModel } from "@/lib/ai";
import { FREE_MODELS } from "@/lib/free-models";
import { CHAT_SYSTEM } from "@/lib/ai/systems/chat";
import { sanitizeInput } from "@/lib/utils";
import { createAdminClient } from "@/lib/supabase/admin";

const VISION_MODEL = "google/gemma-4-26b-a4b-it:free";

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
async function saveMessage(conversationId, role, content, meta = {}) {
  if (!conversationId) return;
  try {
    const adminDb = createAdminClient();
    await adminDb.from("chat_messages").insert({
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
      const imageData = [];
      const adminClient = createAdminClient();

      // Processar ficheiros
      for (const file of files) {
        const isImage = file.type?.startsWith("image/");
        const isPdf = file.type === "application/pdf";
        if (!isImage && !isPdf) continue;

        if (file.url) {
          // Caminho do storage
          if (isPdf) {
            // PDF precisa de Gemini (download direto)
            try {
              const { data: fileData, error } = await adminClient.storage.from("chat-files").download(file.url);
              if (error) throw error;
              const arrayBuffer = await fileData.arrayBuffer();
              const base64Data = Buffer.from(arrayBuffer).toString("base64");
              imageData.push({ inlineData: { mimeType: "application/pdf", data: base64Data } });
            } catch (err) {
              console.warn("[Chat] Falha ao descarregar PDF:", err.message);
            }
          } else {
            // Imagem - tentar signed URL para OpenRouter
            try {
              const { data: signed, error: signError } = await adminClient.storage
                .from("chat-files")
                .createSignedUrl(file.url, 3600);
              if (signError) throw signError;
              imageData.push(signed.signedUrl);
            } catch (err) {
              console.warn("[Chat] Falha a gerar Signed URL:", err.message);
            }
          }
          continue;
        }

        // Fallback antigo (base64 inline)
        if (file.data) {
          const base64Data = file.data.includes("base64,")
            ? file.data.split("base64,")[1]
            : file.data;
          
          if (isPdf) {
            imageData.push({ inlineData: { mimeType: "application/pdf", data: base64Data } });
          } else if (isImage) {
            imageData.push(file.data);
          }
        }
      }

      if (imageData.length === 0) {
        // Sem dados de imagem, usar chat normal
        const fallbackResult = await generateContent(messages, {
          provider: "groq", model: data.model,
          system: CHAT_SYSTEM, temperature: 0.72, maxTokens: 4096,
        });
        content = fallbackResult.text;
      } else {
        try {
          content = await callVision(messages, imageData, {
            model: VISION_MODEL, system: CHAT_SYSTEM,
            temperature: 0.72, maxTokens: 4096,
          });
          provider = "openrouter";
          model = VISION_MODEL;
        } catch (err) {
          console.warn("[Chat] Vision falhou:", err.message);
        }

        // Se todos falharam, usar Groq sem vision (descrever a imagem)
        if (!content) {
          const imageDescription = hasPdf
            ? "[Utilizador enviou um PDF. Pede para descrever o conteúdo.]"
            : "[Utilizador enviou uma imagem. Pede para descrever o conteúdo.]";
          const groqResult = await generateContent(
            [...messages, { role: "user", content: imageDescription }],
            { provider: "groq", model: "llama-3.3-70b-versatile",
              system: CHAT_SYSTEM, temperature: 0.72, maxTokens: 4096 }
          );
          content = groqResult.text;
          provider = groqResult.provider;
          model = groqResult.model;
        }
      }
    }
    // ── SEM FICHEIROS ──
    else {
      try {
        const textResult = await generateContent(messages, {
          provider, model: data.model, capability: "text",
          system: CHAT_SYSTEM, temperature: 0.72, maxTokens: 4096,
        });
        content = textResult.text;
        provider = textResult.provider;
        model = textResult.model;
      } catch (err) {
        console.warn("[Chat] generateContent falhou:", err.message);
      }

      if (!content) {
        throw new Error("Todos os provedores de IA estão indisponíveis. Tenta novamente em alguns minutos.");
      }
    }

    const latencyMs = Date.now() - startTime;

    // ── GUARDAR NO SUPABASE ──
    if (conversationId) {
      // Guardar mensagem do utilizador (última)
      const lastUserMsg = messages.filter(m => m.role === "user").pop();
      if (lastUserMsg) {
        await saveMessage(conversationId, "user", lastUserMsg.content);
      }
      // Guardar resposta da IA
      await saveMessage(conversationId, "assistant", content, {
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
