# AI Provider — Documentação

> Como funciona o routing de providers AI, fallback chains, e modelos.

## Visão Geral

```
generateContent(prompt, opts) → fallback chain: selected → openrouter → groq → nvidia → gemini
callVision(msgs, images, opts) → gemini (inlineData) ou openrouter (image_url)
chat/route.js → getProviderForModel() → chama provider direto (sem fallback chain)
```

## Arquivos Principais

| Arquivo | Função | Linhas |
|---------|--------|--------|
| `lib/ai-provider.js` | Router multi-provider (LEGADO) | ~500 |
| `lib/provider-router.js` | Nova arquitetura com circuit breaker | — |
| `lib/model-registry.js` | Registro centralizado de modelos | — |
| `lib/free-models.js` | Re-export layer (legado) | 133 |
| `lib/groq-models.js` | Allowlist Groq (legado) | 42 |

## Modelos por Provider

| Provider | Modelos | Vision | Notas |
|----------|---------|--------|-------|
| Groq | llama-3.1-8b-instant, llama-3.3-70b-versatile, gpt-oss-20b, gpt-oss-120b | Não | Rápido, free |
| OpenRouter | llama-3.3-70b-instruct:free, nemotron-120b:free, qwen3-coder:free, gemma-4-31b:free, gemma-4-26b:free, nemotron-nano-vl:free | 3 | :free = gratuito |
| Gemini | gemini-2.5-flash | Sim | Único que aceita PDF inline |
| NVIDIA | nemotron-3-super-120b-a12b, llama-3.3-nemotron-49b | Não | Cuidado: pode custar |

## Fallback Chain

```
1. Provider selecionado pelo utilizador
2. Se falhar → OpenRouter
3. Se falhar → Groq
4. Se falhar → NVIDIA
5. Se falhar → Gemini
```

### Circuit Breaker
- 3 falhas consecutivas → open circuit por 60s
- Exponential backoff: 1s → 2s → 4s com jitter
- Respeita Retry-After headers

## Fluxo Chat com Anexos

```
1. Extrair files do request ANTES do Zod
2. Validar MIME (image/png, jpeg, webp, application/pdf)
3. Se tem PDFs → forçar Gemini (OpenRouter não suporta PDF inline)
4. Se tem imagens → provider selecionado:
   - Gemini: inlineData (base64)
   - OpenRouter: image_url (data URL)
5. Se não tem ficheiros → chamar provider direto
```

## Gemini — Detalhes Específicos

### URL Dinâmica
```javascript
// Antes (legado)
GEMINI_API_URL = .../gemini-2.0-flash:generateContent

// Depois (novo)
GEMINI_BASE_URL = .../models
getGeminiUrl(model) → .../models/{model}:generateContent
```

### Model Allowlist
```javascript
GEMINI_MODEL_ALLOWLIST = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro']
```

### System Instruction Nativo
```javascript
// Antes: system prompt via message pair
// Depois: body.systemInstruction = { parts: [{ text: ... }] }
```

## Bugs Conhecidos

1. **`||` vs `??`**: `options.temperature || 0.7` substitui 0 por 0.7. Usar `??`.
2. **System message duplication**: Todas as funções prepend system E messages com system duplicado. Fix: `.filter(m => m.role !== "system")`.
3. **NVIDIA `:free`**: Convenção OpenRouter, inválida na API NVIDIA.
4. **Gemini quota esgemini-2.0-flash**: Limit 0 no free tier (Julho 2026).

## Migração Legado → Nova Arquitetura

| Legado | Nova | Status |
|--------|------|--------|
| ai-provider.js | provider-router.js | ✅ Criado |
| free-models.js | model-registry.js | ✅ Criado (re-export) |
| groq-models.js | model-registry.js | ✅ Substituído |
| — | systems/*.js | ✅ Criado |
| — | prompts/*.js | ✅ Criado |
| — | schemas/output.js | ✅ Criado |
| — | quality/rubrics.js | ✅ Criado |

## Return Value Diference

```javascript
// Antes (ai-provider.js): retorna string
generateContent(prompt) → "resposta da IA"

// Depois (provider-router.js): retorna objeto
generateContent(prompt) → { text, provider, model, attempts, latencyMs }
```

**Cuidado**: Callers migrados devem extrair `.text`.
