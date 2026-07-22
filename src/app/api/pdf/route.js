import { NextResponse } from "next/server";
import { authenticateAndRateLimit } from "@/lib/api-helpers";
import { generateContent, callVision } from "@/lib/ai";
import { buildSystemWithPersona } from "@/lib/ai/systems/base";
import { z } from "zod";

const PDF_PERSONA = `
## Persona: Analista de Documentos
- Analisa PDFs académicos e produz material de estudo estruturado.
- Extrai conceitos-chave, relações e exercícios.
- Descreve imagens, tabelas e gráficos quando presentes.
- Português correcto (variante angolana/portuguesa).
`.trim();

const PDF_SYSTEM = buildSystemWithPersona(PDF_PERSONA);

const PDF_FORMAT = `
## FORMATO DE RESPOSTA (Markdown)

Responde SEMPRE neste formato:

# [Título do Conteúdo Analisado]

## Mapa Conceptual

\`\`\`
[Tipo: diagrama em texto com conexões entre conceitos principais]
\`\`\`

## Resumo Estruturado

### Conceitos-Chave
- **Conceito 1**: Explicação breve e clara
- **Conceito 2**: Explicação breve e clara

### Detalhes Importantes
- Ponto relevante 1 com contexto
- Ponto relevante 2 com contexto

### Exercícios Práticos
1. **Exercício 1**: Pergunta ou problema
2. **Exercício 2**: Pergunta ou problema
3. **Exercício 3**: Pergunta ou problema

## Glossário
- **Termo 1**: Definição simples
- **Termo 2**: Definição simples

## Perguntas para Revisão
- Pergunta 1?
- Pergunta 2?
- Pergunta 3?
`.trim();

// Schema de validação para limitar tamanho da entrada
const pdfRequestSchema = z
  .object({
    text: z.string().max(100_000, "Texto demasiado longo (máx 100.000 caracteres).").optional(),
    images: z
      .array(z.string().max(8_000_000, "Imagem demasiado grande."))
      .max(20, "Demasiadas imagens (máx 20).")
      .optional(),
    filename: z.string().max(255).optional().default("documento.pdf"),
  })
  .refine(
    (data) => Boolean(data.text?.trim()) || Boolean(data.images?.length),
    { message: "Envie texto ou pelo menos uma imagem." }
  );

export async function POST(request) {
  const startTime = Date.now();

  try {
    const { error: authError } = await authenticateAndRateLimit(request);
    if (authError) return authError;

    const rawBody = await request.json();
    const parsed = pdfRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue.message || "Dados de entrada inválidos." },
        { status: 400 }
      );
    }

    const { text, images, filename } = parsed.data;

    // Construir prompt
    let prompt = "";
    if (text) {
      const textPreview = text.slice(0, 30000);
      prompt = `Analisa o seguinte conteudo extraido do PDF "${filename || "documento"}":\n\n${textPreview}\n\n---\n\n${PDF_FORMAT}`;
    } else {
      prompt = `Analisa o PDF "${filename || "documento"}" e produz material de estudo estruturado.\n\n${PDF_FORMAT}`;
    }

    let responseText;
    let model = "google/gemma-4-26b-a4b-it:free";

    // Se tem imagens (paginas do PDF renderizadas), usa visao via OpenRouter
    if (images && images.length > 0) {
      const imageData = images.map((img) => {
        const base64Data = typeof img === "string"
          ? (img.includes("base64,") ? img.split("base64,")[1] : img)
          : img;
        return { inlineData: { mimeType: "image/jpeg", data: base64Data } };
      });

      responseText = await callVision(
        [{ role: "user", content: prompt }],
        imageData,
        { model: "google/gemma-4-26b-a4b-it:free", system: PDF_SYSTEM, temperature: 0.4, maxTokens: 8192 }
      );
    } else {
      // Apenas texto — usa provider central com fallback
      const result = await generateContent(prompt, {
        provider: "groq",
        model: "llama-3.3-70b-versatile",
        capability: "text",
        system: PDF_SYSTEM,
        temperature: 0.4,
        maxTokens: 8192,
      });
      responseText = result.text;
      model = result.model;
    }

    // Extrair titulo do resultado
    const titleMatch = responseText.match(/^#\s+(.+)$/m);
    const resultTitle = titleMatch ? titleMatch[1].trim() : (filename || "Analise de PDF");

    const latencyMs = Date.now() - startTime;
    console.log("[PDF] Analisado:", { model, latencyMs, hasImages: images?.length > 0 });

    return NextResponse.json({
      markdown: responseText,
      title: resultTitle,
      model,
      meta: { latencyMs },
    });
  } catch (error) {
    console.error("[API /pdf] Erro:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao analisar o PDF." },
      { status: 500 }
    );
  }
}
