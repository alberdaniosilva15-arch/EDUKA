import { NextResponse } from "next/server";
import { authenticateAndRateLimit } from "@/lib/api-helpers";
import { generateContent, callVision } from "@/lib/ai/provider-router";
import { buildSystemWithPersona } from "@/lib/ai/systems/base";

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

const API_TIMEOUT_MS = 60000;

export async function POST(request) {
  const startTime = Date.now();

  try {
    const { error: authError } = await authenticateAndRateLimit(request);
    if (authError) return authError;

    const { text, images, filename } = await request.json();

    if (!text && (!images || images.length === 0)) {
      return NextResponse.json(
        { error: "Nenhum conteudo enviado. Envia um PDF ou insere texto." },
        { status: 400 }
      );
    }

    // Construir prompt
    let prompt = "";
    if (text) {
      const textPreview = text.slice(0, 30000);
      prompt = `Analisa o seguinte conteudo extraido do PDF "${filename || "documento"}":\n\n${textPreview}\n\n---\n\n${PDF_FORMAT}`;
    } else {
      prompt = `Analisa o PDF "${filename || "documento"}" e produz material de estudo estruturado.\n\n${PDF_FORMAT}`;
    }

    let responseText;
    let model = "gemini-2.0-flash";

    // Se tem imagens (paginas do PDF renderizadas), usa visao
    if (images && images.length > 0) {
      const imageData = images.map((img) => {
        const base64Data = typeof img === "string"
          ? (img.includes("base64,") ? img.split("base64,")[1] : img)
          : img;
        return { inlineData: { mimeType: "image/jpeg", data: base64Data } };
      });

      // Gemini vision directamente (PDFs so funcionam com Gemini)
      const { callGeminiVision } = await import("@/lib/ai-provider");
      responseText = await callGeminiVision(
        [{ role: "user", content: prompt }],
        imageData,
        { system: PDF_SYSTEM, temperature: 0.4, maxTokens: 8192 }
      );
    } else {
      // Apenas texto — usa provider central com fallback
      const result = await generateContent(prompt, {
        provider: "gemini",
        capability: "pdf",
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
