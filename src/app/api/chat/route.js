import { NextResponse } from "next/server";
import { authenticateAndRateLimit, validateSchema } from "@/lib/api-helpers";
import { chatSchema } from "@/lib/api-schemas";
import { callGroqMessages, callOpenRouterMessages, callVision, callGeminiVision } from "@/lib/ai-provider";
import { FREE_MODELS, isVisionModel, getProviderForModel } from "@/lib/free-models";
import { sanitizeInput } from "@/lib/utils";

const CHAT_SYSTEM_PROMPT = `
Es o Eduka Chat, um assistente academico e criativo para estudantes angolanos.
Responde em portugues de Angola/Portugal, com clareza, rigor e tom natural.

## CAPACIDADES

Tens 5 modos especializados. Ativa o modo certo conforme o pedido do utilizador, NAO sempre.

### 1. MODO ENSINO (Aprender)
Ativa quando: utilizador quer aprender, entender, explicar algo, estudar para prova, tem duvidas.
- Diagnostica onde o aluno esta antes de ensinar
- Usa perguntas guiadas, nao de respostas directas
- Ensina o raciocinio, nao so a resposta
- Cria exercicios, quiz, flashcards quando pedido
- Exemplo: "Explica monadas" → diagnostico → ensino progressivo

### 2. MODO TECNICO (Codigo/Debug)
Ativa quando: utilizador pede ajuda com codigo, terminal, Docker, APIs, configuracao, instalacao, erros.
- NUNCA executar comandos destrutivos sem confirmacao
- SEMPRE mostrar o comando ANTES de sugerir
- Diagnostica antes de resolver: "mostra-me o erro completo"
- Verifica ambiente (versoes, directorio, dependencias)
- Estrutura: Diagnostico → Comandos de validacao → Solucao → Verificacao
- Exemplo: "roda esse script" → verifica versao, ficheiro, depois executa

### 3. MODO ESCRITA (Trabalhos/Textos)
Ativa quando: utilizador quer escrever, revisar, melhorar textos academicos, trabalhos, ensaios.
- Oferece estrutura (introducao, desenvolvimento, conclusao)
- Separa factos de hipoteses
- Nao inventa referencias, estatisticas ou DOI
- Melhora gramatica, estilo, coherencia
- Exemplo: "Ajuda-me com trabalho sobre X" → estrutura → rascunho → revisao

### 4. MODO CRIACAO (Slides/Visual)
Ativa quando: utilizador quer criar slides, presentacoes, estruturas visuais.
- Cria estrutura logica de slides
- Sugere conteudo por slide (titulo, bullets, notas)
- Recomenda visuais e exemplos reais
- Exemplo: "Cria slides sobre X" → estrutura → conteudo → notas

### 5. MODO PESQUISA (Investigacao)
Ativa quando: utilizador quer investigar, comparar opcoes, analisar dados, profundar num tema.
- Organiza informacao por fontes
- Separa o que e certo do que precisa confirmacao
- Oferece multiplas perspectivas
- Exemplo: "Pesquisa sobre X" → fontes → analise → conclusoes

## REGRAS GLOBAIS
- Se o aluno pedir fontes ou exemplos reais, separa o que sabes do que deve ser confirmado.
- Nao inventes estatisticas, leis, autores, DOI ou links.
- Para tarefas academicas, ensina o raciocinio e oferece estrutura, nao apenas resposta final.
- Mantem respostas uteis e diretas, mas desenvolve quando o assunto exigir.
- Responde SEMPRE em portugues de Angola/Portugal.
- Nao uses emojis excessivamente.
- Quando nao tiveres certeza, diz "nao tenho certeza, confirma com fonte oficial".
`.trim();

function isFreeModel(modelId) {
  return FREE_MODELS.some((m) => m.id === modelId);
}

/**
 * Determina se o pedido tem ficheiros visuais (imagens ou PDF)
 */
function hasVisualFiles(files) {
  if (!files || files.length === 0) return false;
  return files.some((f) =>
    f.type?.startsWith("image/") || f.type === "application/pdf"
  );
}

export async function POST(request) {
  try {
    const { error: authError } = await authenticateAndRateLimit(request);
    if (authError) return authError;

    const raw = await request.json();
    const modelId = raw.model || FREE_MODELS[0].id;
    const sanitized = {
      model: isFreeModel(modelId) ? modelId : FREE_MODELS[0].id,
      messages: Array.isArray(raw.messages)
        ? raw.messages.map((message) => ({
            role: message.role,
            content: sanitizeInput(message.content || ""),
            files: message.files || undefined,
          }))
        : [],
      files: raw.files || [],
    };

    const { valid, data, error: validationError } = validateSchema(chatSchema, sanitized);
    if (!valid) return validationError;

    const messages = data.messages.slice(-20);
    const files = data.files || [];
    const hasVisionFiles = hasVisualFiles(files);

    let content;

    // ── SE TEM FICHEIROS VISUAIS ──
    if (hasVisionFiles) {
      const visionModel = isVisionModel(data.model) ? data.model : "gemini-2.0-flash";
      const provider = getProviderForModel(visionModel);

      // Extrair imagens dos ficheiros (imagens directas ou PDF convertido)
      const imageData = [];
      for (const file of files) {
        if (file.type?.startsWith("image/") && file.data) {
          imageData.push(file.data);
        } else if (file.type === "application/pdf" && file.data) {
          // PDF como imagem via Gemini (Gemini aceita PDF nativamente)
          // Enviar o proprio PDF como imagem
          imageData.push(file.data);
        }
      }

      // Se nao conseguiu extrair imagens, fallback para texto
      if (imageData.length === 0) {
        content = await callOpenRouterMessages(messages, {
          model: data.model,
          system: CHAT_SYSTEM_PROMPT,
          temperature: 0.72,
          maxTokens: 4096,
        });
      } else {
        content = await callVision(messages, imageData, {
          model: visionModel,
          provider,
          system: CHAT_SYSTEM_PROMPT,
          temperature: 0.72,
          maxTokens: 4096,
        });
      }
    }
    // ── SEM FICHEIROS ──
    else if (data.model.includes(":free") || data.model.includes("openrouter")) {
      content = await callOpenRouterMessages(messages, {
        model: data.model,
        system: CHAT_SYSTEM_PROMPT,
        temperature: 0.72,
        maxTokens: 4096,
      });
    } else if (data.model.includes("gemini")) {
      const { generateContent } = await import("@/lib/ai-provider");
      const lastUserMsg = messages[messages.length - 1]?.content || "";
      content = await generateContent(lastUserMsg, {
        provider: "gemini",
        system: CHAT_SYSTEM_PROMPT,
        temperature: 0.72,
        maxTokens: 4096,
      });
    } else {
      content = await callGroqMessages(messages, {
        model: data.model,
        system: CHAT_SYSTEM_PROMPT,
        temperature: 0.72,
        maxTokens: 4096,
      });
    }

    return NextResponse.json({
      message: { role: "assistant", content },
      model: data.model,
    });
  } catch (error) {
    console.error("[API /chat] Erro:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao conversar com a IA." },
      { status: 500 }
    );
  }
}
