import { NextResponse } from "next/server";
import { generateContent } from "@/lib/ai-provider";
import { buildPremiumSlidesPrompt } from "@/lib/quality-prompts";
import { sanitizeInput } from "@/lib/utils";
import { authenticateAndRateLimit, validateSchema } from "@/lib/api-helpers";
import { slidesSchema } from "@/lib/api-schemas";

function parseSlidesJson(rawResponse) {
  const cleanJson = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
  const start = cleanJson.indexOf("[");
  const end = cleanJson.lastIndexOf("]");
  const candidate = start >= 0 && end > start ? cleanJson.slice(start, end + 1) : cleanJson;
  const parsed = JSON.parse(candidate);

  // Ensure it's an array of objects with required fields
  if (!Array.isArray(parsed)) throw new Error("Response is not an array");
  return parsed.map((slide, i) => ({
    title: slide.title || `Slide ${i + 1}`,
    subtitle: slide.subtitle || "",
    layout: slide.layout || "visual-right",
    content: Array.isArray(slide.content) ? slide.content : [],
    visual: slide.visual || { type: "diagram", prompt: slide.title || "", query: slide.title || "", caption: slide.title || "", alt: slide.title || "" },
    realExample: slide.realExample || null,
    notes: slide.notes || "",
  }));
}

export async function POST(request) {
  try {
    // 1. Auth + Rate limit por user_id
    const { user, supabase, error: authError } = await authenticateAndRateLimit(request);
    if (authError) return authError;

    // 2. Parse + sanitizar + validar com Zod
    const raw = await request.json();
    const sanitized = {
      topic: sanitizeInput(raw.topic),
      numSlides: raw.numSlides,
      style: sanitizeInput(raw.style),
      model: raw.model || "meta-llama/llama-3.3-70b-instruct:free",
    };
    const { valid, data, error: validationError } = validateSchema(slidesSchema, sanitized);
    if (!valid) return validationError;

    // 3. Determinar provider a partir do model ID
    const provider = data.model.includes(":free") ? "openrouter"
      : data.model.includes("gemini") ? "gemini"
      : "groq";

    // 4. Gerar conteúdo
    const prompt = buildPremiumSlidesPrompt(data);
    const rawResponse = await generateContent(prompt, {
      provider,
      model: data.model,
      system: "Es um diretor de apresentacoes da Eduka. Usa pesquisa e exemplos reais quando disponiveis; devolve apenas JSON valido.",
      temperature: 0.55,
      maxTokens: 8192,
    });

    let jsonContent;
    try {
      jsonContent = parseSlidesJson(rawResponse);
      if (!Array.isArray(jsonContent) || jsonContent.length < 1) {
        throw new Error("Formato de slides invalido.");
      }
      // Trim or pad to requested count
      if (jsonContent.length > data.numSlides) {
        jsonContent = jsonContent.slice(0, data.numSlides);
      }
    } catch (parseError) {
      console.error("Failed to parse JSON slides:", parseError.message);
      console.error("Raw response snippet:", rawResponse?.substring(0, 300));
      return NextResponse.json({ error: "A IA não conseguiu formatar os slides corretamente. Tenta novamente." }, { status: 500 });
    }

    return NextResponse.json({ slides: jsonContent });

  } catch (error) {
    console.error("Slides API Error:", error.message || error);
    const msg = error.message?.includes("autenticado")
      ? "Sessão expirada. Faz login novamente."
      : error.message?.includes("indisponíveis")
        ? "Serviço de IA temporariamente indisponível. Tenta novamente em alguns minutos."
        : "Ocorreu um erro ao gerar os slides. Tenta novamente.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
