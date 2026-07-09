import { NextResponse } from "next/server";
import { authenticateAndRateLimit } from "@/lib/api-helpers";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const API_TIMEOUT_MS = 60000;

const SYSTEM_PROMPT = `Es o Eduka PDF Analyzer, um assistente especializado em analisar PDFs academicos.

Tua missao: analisar o conteudo dos PDFs enviados e produzir material de estudo estruturado.

## FORMATO DE RESPOSTA (Markdown)

Responde SEMPRE neste formato exato:

# [Titulo do Conteudo Analisado]

## Mapa Conceptual

\`\`\`
[Mapa conceptual em formato de texto com conexoes entre conceitos principais.
 Usa indentacao e simbolos como -> para mostrar relacoes.
 Exemplo:
 Tema Principal
   ├── Conceito A
   │   ├── Sub-conceito A1 -> Detalhe importante
   │   └── Sub-conceito A2 -> Outro detalhe
   └── Conceito B
       ├── Sub-conceito B1
       └── Sub-conceito B2 -> Relacao com Conceito A
]
\`\`\`

## Resumo Estruturado

### Conceitos-Chave
- **Conceito 1**: Explicacao breve e clara
- **Conceito 2**: Explicacao breve e clara

### Detalhes Importantes
- Ponto relevante 1 com contexto
- Ponto relevante 2 com contexto

### Exercicios Praticos
1. **Exercicio 1**: Pergunta ou problema para testar compreensao
2. **Exercicio 2**: Pergunta ou problema para testar compreensao
3. **Exercicio 3**: Pergunta ou problema para testar compreensao

## Glossario
- **Termo 1**: Definicao simples
- **Termo 2**: Definicao simples

## Perguntas para Revisao
- Pergunta 1?
- Pergunta 2?
- Pergunta 3?

---

Mantem o portugues de Angola/Portugal. Se o PDF tiver imagens, tabelas ou graficos, descreve-os no resumo.`.trim();

function buildGeminiRequest(textPrompt, base64Images) {
  const parts = [{ text: SYSTEM_PROMPT + "\n\n---\n\n" + textPrompt }];
  
  if (base64Images && base64Images.length > 0) {
    for (const img of base64Images) {
      const data = img.includes("base64,") ? img.split("base64,")[1] : img;
      parts.push({
        inlineData: { mimeType: "image/jpeg", data },
      });
    }
  }

  return {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 16384,
      topP: 0.95,
    },
  };
}

export async function POST(request) {
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY nao configurada no servidor." },
        { status: 500 }
      );
    }

    // Construir prompt com o texto extraido
    let prompt = "";
    if (text) {
      const textPreview = text.slice(0, 30000);
      prompt = `Analisa o seguinte conteudo extraido do PDF "${filename || "documento"}":\n\n${textPreview}`;
    }

    // Se tem imagens (paginas do PDF renderizadas), usa visao
    let responseText;
    if (images && images.length > 0) {
      const body = buildGeminiRequest(prompt, images);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
      
      try {
        const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Gemini error ${res.status}: ${errorText}`);
        }

        const data = await res.json();
        responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } finally {
        clearTimeout(timeoutId);
      }
    } else {
      // Apenas texto - usa o provider normal
      const { generateContent } = await import("@/lib/ai-provider");
      responseText = await generateContent(prompt, {
        provider: "gemini",
        temperature: 0.4,
        maxTokens: 16384,
      });
    }

    // Extrair titulo do resultado
    const titleMatch = responseText.match(/^#\s+(.+)$/m);
    const resultTitle = titleMatch ? titleMatch[1].trim() : (filename || "Analise de PDF");

    return NextResponse.json({
      markdown: responseText,
      title: resultTitle,
      model: "gemini-2.0-flash",
    });
  } catch (error) {
    console.error("[API /pdf] Erro:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao analisar o PDF." },
      { status: 500 }
    );
  }
}
