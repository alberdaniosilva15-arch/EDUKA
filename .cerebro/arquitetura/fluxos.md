# Fluxos Principais

> Como os dados fluem pelo sistema em cada funcionalidade.

## Fluxo Chat (mais complexo)

```
1. Usuário envia mensagem + anexos (opcional)
2. api-helpers.js: authenticateAndRateLimit() → valida auth + rate limit
3. api-schemas.js: chatSchema → valida mensagem + ficheiros
4. Extrair files ANTES do Zod
5. Validar MIME (image/png, jpeg, webp, application/pdf)
6. Se tem PDFs → forçar Gemini (OpenRouter não suporta PDF inline)
7. Se tem imagens → provider selecionado:
   - Gemini: inlineData (base64)
   - OpenRouter: image_url (data URL)
8. Se não tem ficheiros → chamar provider direto
9. getProviderForModel() → seleciona provider correto
10. generateContent() ou callVision()
11. Retorna resposta + meta (provider, model, latencyMs)
```

**Arquivos envolvidos**: `api/chat/route.js`, `lib/ai-provider.js`, `lib/api-helpers.js`, `lib/api-schemas.js`

## Fluxo Geração (Trabalhos)

```
1. Usuário envia: tema, tipo, modelo, opções
2. Validação: generateSchema
3. buildPremiumWorkPrompt() → monta prompt estruturado
4. generateContent() → fallback chain: selected → openrouter → groq → nvidia → gemini
5. Validação de output: Zod schema
6. Retorna: trabalho + meta
```

**Arquivos envolvidos**: `api/generate/route.js`, `lib/quality-prompts.js`, `lib/ai-provider.js`

## Fluxo Slides

```
1. Usuário envia: tema, numSlides, modelo, opções
2. Validação: slidesSchema
3. buildPremiumSlidesPrompt() → monta prompt com schema
4. generateContent() → IA gera JSON estruturado
5. Validação: slidesOutputSchema
6. Score: scoreSlides() → qualidade por slide
7. professional-slides-generator.js → gera PPTX
8. Retorna: slides + meta + quality metrics
```

**Arquivos envolvidos**: `api/slides/route.js`, `lib/quality-prompts.js`, `lib/ai-provider.js`, `lib/professional-slides-generator.js`

## Fluxo Explicar

```
1. Usuário envia: tema, modelo
2. Validação: explainSchema
3. buildExplainPrompt() → prompt para explicação didática
4. generateContent()
5. Retorna: explicação + meta
```

**Arquivos envolvidos**: `api/explain/route.js`, `lib/prompts.js`, `lib/ai-provider.js`

## Fluxo Melhorar

```
1. Usuário envia: texto, modelo
2. Validação: improveSchema
3. buildImprovePrompt() → prompt para melhoria
4. generateContent()
5. Retorna: texto melhorado + meta
```

**Arquivos envolvidos**: `api/improve/route.js`, `lib/prompts.js`, `lib/ai-provider.js`

## Fluxo Estudo

```
1. Usuário envia: tema, modelo
2. Validação: estudoSchema
3. buildStudyPrompt() → prompt para plano de estudo
4. generateContent()
5. Retorna: plano + meta
```

**Arquivos envolvidos**: `api/estudo/route.js`, `lib/prompts.js`, `lib/ai-provider.js`

## Fluxo PDF

```
1. Usuário envia: PDF + pergunta
2. pdf-parser.js → extrai texto do PDF
3. Se é PDF baseado em imagem → Gemini (único que aceita inline)
4. Se é texto → generateContent()
5. Retorna: resposta sobre o PDF + meta
```

**Arquivos envolvidos**: `api/pdf/route.js`, `lib/pdf-parser.js`, `lib/ai-provider.js`

## Fluxo Autenticação

```
1. Usuário faz login/registro
2. middleware.js → Supabase session refresh
3. Protege /ferramentas e /chat (redirect /login)
4. Logout apenas POST (CSRF protection)
```

**Arquivos envolvidos**: `middleware.js`, `lib/supabase/server.js`, `lib/supabase/client.js`

## Fluxo Rate Limit (Dual)

```
1. Middleware: IP-based (geral)
   - auth: 5/15min
   - api: 30/1min
   - general: 100/1min
2. api-helpers.js: user_id-based (AI)
   - 20 gerações/hora
   - Supabase RPC atômico (increment_rate_limit)
3. Se RPC falhar → console.error + allow (nunca expor ao client)
```

## Fallback Chain (AI Providers)

```
generateContent(prompt, opts):
  1. Provider selecionado pelo usuário
  2. Se falhar → OpenRouter
  3. Se falhar → Groq
  4. Se falhar → NVIDIA
  5. Se falhar → Gemini

Circuit breaker: 3 falhas consecutivas → open 60s
Backoff: 1s → 2s → 4s com jitter
```
