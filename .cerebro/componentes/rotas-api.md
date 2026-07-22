# Rotas API — Documentação

> Cada rota: o que faz, dependências, e particularidades.

## Resumo

| Rota | Método | Função | Linhas |
|------|--------|--------|--------|
| `/api/chat` | POST | Chat multi-provider com anexos | 201 |
| `/api/generate` | POST | Gerar trabalhos académicos | 44 |
| `/api/slides` | POST | Gerar slides PPTX | 87 |
| `/api/explain` | POST | Explicar temas | 35 |
| `/api/improve` | POST | Melhorar textos | 35 |
| `/api/estudo` | POST | Planos de estudo | 38 |
| `/api/pdf` | POST | Processar PDFs | — |
| `/api/curriculo` | POST | Gerar currículo | — |
| `/api/chat/stream` | POST | Chat com streaming | — |
| `/api/generate/stream` | POST | Geração com streaming | — |

## Fluxo Comum (todas as rotas)

```
1. Middleware: rate limit IP + proteção rotas
2. authenticateAndRateLimit(): auth Supabase + rate limit user_id
3. validateSchema(): Zod safeParse com erros em português
4. generateContent(): IA com fallback chain
5. Retorna: { data, meta: { provider, model, latencyMs, quality? } }
```

## /api/chat

**Arquivo**: `api/chat/route.js`

**Particularidades**:
- Extrai files ANTES do Zod
- Valida MIME (image/png, jpeg, webp, application/pdf)
- Força Gemini se houver PDFs
- Imagens: Gemini (inlineData) vs OpenRouter (image_url)
- getProviderForModel() para routing

**Schema**: chatSchema (api-schemas.js)

## /api/generate

**Arquivo**: `api/generate/route.js`

**Particularidades**:
- buildPremiumWorkPrompt() para prompt estruturado
- Validação de output: Zod schema
- Quality scoring

**Schema**: generateSchema

## /api/slides

**Arquivo**: `api/slides/route.js`

**Particularidades**:
- buildPremiumSlidesPrompt() com schema
- Validação: slidesOutputSchema
- Score: scoreSlides() → qualidade por slide
- professional-slides-generator.js → PPTX
- Meta com quality metrics

**Schema**: slidesSchema

## /api/explain

**Arquivo**: `api/explain/route.js`

**Particularidades**:
- buildExplainPrompt() para explicação didática
- Mais simples que generate/slides

**Schema**: explainSchema

## /api/improve

**Arquivo**: `api/improve/route.js`

**Particularidades**:
- buildImprovePrompt() para melhoria de texto
- Mais simples que generate/slides

**Schema**: improveSchema

## /api/estudo

**Arquivo**: `api/estudo/route.js`

**Particularidades**:
- buildStudyPrompt() para plano de estudo
- Schema tem campo `model` com default
- Passa provider e model para generateContent()

**Schema**: estudoSchema

## /api/pdf

**Arquivo**: `api/pdf/route.js`

**Particularidades**:
- pdf-parser.js para extrair texto
- Se PDF baseado em imagem → Gemini direto
- Se texto → generateContent()
- **BYPASS de ai-provider**: Para image PDFs, chama Gemini API diretamente com timeout/retry duplicados

## /api/curriculo

**Arquivo**: `api/curriculo/route.js`

**Particularidades**:
- Deve ser interativo: perguntar tipo de emprego, empresa, skills, experiência
- **Bug**: Linha 155 expõe error.message ao client (PENDENTE)
- **Bug**: Linha 71 tem typo no prompt `[a.Resume o perfil...]`

## /api/chat/stream

**Arquivo**: `api/chat/stream/route.js`

**Particularidades**:
- Streaming de resposta
- **Bug**: System prompt hardcoded (L45) em vez de usar CHAT_SYSTEM
- **Bug**: isVisionModel import não usado
- **Bug**: lastUserMsg computed mas não usado

## /api/generate/stream

**Arquivo**: `api/generate/stream/route.js`

**Particularidades**:
- **Bug**: System prompt hardcoded (L45) em vez de usar WORK_SYSTEM

## Headers de Resposta

Todas as rotas retornam:
- `X-RateLimit-Limit`: Limite máximo
- `X-RateLimit-Remaining`: Requests restantes
- `X-RateLimit-Reset`: Timestamp de reset
- `X-Request-ID`: ID único do request

## Validação de Input

Todas as rotas usam:
- `validateSchema()`: Zod safeParse com erros em português
- `authenticateAndRateLimit()`: Auth + rate limit

## Validação de Output (novas rotas)

- `schemas/output.js`: Zod schemas para output da IA
- Validação determinística antes de retry
- Apenas campos falhados são retryed, não regeneração completa
