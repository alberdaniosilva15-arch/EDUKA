# Bugs Corrigidos — Histórico

> Fixes já aplicados. Útil para entender o que já foi resolvido e como.

## Correções P1 (18 Julho 2026)

### P1: generate/stream hardcoded system prompt
- **Arquivo**: `api/generate/stream/route.js:45`
- **Problema**: System prompt era string inline em vez de usar WORK_SYSTEM
- **Fix**: Importar WORK_SYSTEM de `@/lib/ai/systems/work` e usar na chamada
- **Resultado**: Respostas agora seguem regras do orientador académico

### P1: generateContentStream não aceita messages array
- **Arquivo**: `lib/ai/streaming.js:25-28`
- **Problema**: Função wraps prompt como single user message, perde contexto
- **Fix**: Adicionado parâmetro `messages` que aceita array de mensagens
- **Comportamento**: Se `messages` fornecido, usa array; senão, wrapping tradicional
- **Retrocompatibilidade**: Callers existentes continuam a funcionar

### P1: curriculo/route.js expõe error.message
- **Arquivo**: `api/curriculo/route.js:155`
- **Problema**: Única rota que retorna `error.message` raw ao client
- **Fix**: Mensagem genérica "Erro ao gerar currículo." em vez de error.message
- **Segurança**: Evita vazar detalhes internos (stack traces, paths, etc.)

### P1: curriculo prompt typo
- **Arquivo**: `api/curriculo/route.js:71`
- **Problema**: `[a.Resume o perfil e o que procura]` tinha "a." extra antes de "Resume"
- **Fix**: Removido "a." — `[Resume o perfil e o que procura]`

## Correções P0 (Julho 2026)

### P0 #1: hasPdfInImages undefined
- **Arquivo**: `api/chat/route.js:172`
- **Problema**: Variável `hasPdfInImages` não definida
- **Fix**: Substituído por `hasPdf` (definida L83)
- **Tipo**: Rename simples, mesma lógica

### P0 #2 + P1 #3: Chat migration + callVision
- **Arquivos**: `api/chat/route.js`, `lib/ai-provider.js`
- **Problema**: Chat não usava nova arquitetura; callVision não aceitava inlineData
- **Fix**: Migração completa do chat para generateContent/callVision
- **Resultado**: callGroqMessages, callOpenRouterMessages, callOpenRouterVision → todos substituídos
- **Linhas**: 248→218

### P1 #4: Rate limit race condition
- **Arquivo**: `lib/api-helpers.js`
- **Problema**: Read/check/update sequencial causava race condition
- **Fix**: RPC atômico `increment_rate_limit` (PL/pgSQL)
- **Migração**: `003_rate_limit_rpc.sql`
- **Buge caught**: `v_window_start` devia ser `v_now` no branch de reset
- **Fallback**: RPC falha → `console.error` + allow (nunca expor ao client)

## Correções P2 (Julho 2026)

### P2 #5: Streaming rate limit headers
- **Arquivos**: `api/chat/stream/route.js`, `api/generate/stream/route.js`
- **Problema**: Streaming não retornava headers de rate limit
- **Fix**: Wrap Response com `withRateLimitHeaders`

### P2 #12: sanitizeInput marker filtering
- **Arquivo**: `lib/utils.js`
- **Problema**: Não filtrava markers de chat injection
- **Fix**: Adicionado filtros para `<|im_start|>`, `[INST]`, `<|system|>`, etc.
- **Nota**: Defesa estrutural (system/user separation) é primária

### P2 #13: CSRF Origin/Referer check
- **Arquivo**: `middleware.js`
- **Problema**: POST /api/* sem proteção CSRF
- **Fix**: Validação Origin/Referer para POST /api/*
- **Exceção**: /api/webhooks/* (usa cryptographic signature)

### P2 #6: localStorage base64 strip
- **Arquivo**: `app/chat/page.js`
- **Problema**: Ficheiros base64 em localStorage (5×10MB)
- **Fix**: Strip `data` field antes de gravar; migration on load; display fallback

## Correções de Schema (Julho 2026)

### Database tables missing
- **Problema**: Supabase tinha auth mas zero tabelas
- **Fix**: 3 scripts SQL executados pelo utilizador
- **Verificação**: REST API OpenAPI spec confirma 7 tabelas + RPC

### estudo route model field
- **Arquivo**: `api/estudo/route.js`, `lib/api-schemas.js`
- **Problema**: Frontend enviava `model: "gemini"` mas schema não tinha campo
- **Fix**: Adicionado `model: z.string().max(200).optional().default(...)` ao estudoSchema

## Correções de Slides (Julho 2026)

### Slide preview field mismatch
- **Arquivo**: `app/slides/page.js`
- **Problema**: Frontend usava `slide.content` mas API retornava `bullets`
- **Fix**: Fallback field names: `(slide.bullets || slide.content)`

### PPTX normaliseSlide field mapping
- **Arquivo**: `lib/professional-slides-generator.js`
- **Problema**: Campos da IA não mapeavam para PPTX
- **Fix**: bullets→content, speakerNotes→notes, keyMessage→subtitle, evidence→realExample

### Prompt template regex pitfall
- **Arquivo**: `lib/quality-prompts.js`
- **Problema**: Regex tentava matchar syntax pré-avaliação (não existia)
- **Fix**: `/\{numSlides\}/g` em vez de `/\$\{"\{numSlides\}"\}/g`
- **Lição**: Testar regex contra output renderizado, não template fonte

## Correções de System Message Duplication (Julho 2026)

### ai-provider.js
- **Problema**: callGroqMessages, callOpenRouterMessages, callNvidiaMessages prepend system E messages com system duplicado
- **Fix**: `.filter((m) => m.role !== "system")` em todas as funções

### provider-router.js
- **Problema**: callVision tinha mesmo padrão no Gemini section
- **Fix**: `filteredMessages = system ? messages.filter((m) => m.role !== "system") : messages`

## Lições Aprendidas

1. **`||` vs `??` para defaults numéricos**: `||` substitui 0 por 0.7. Usar `??`.
2. **Testar regex contra output renderizado**: Templates têm sintaxe que desaparece após render.
3. **Migrações combinadas**: P0 #2 + P1 #3 tinham que ser feitas juntas (dependem uma da outra).
4. **RPC > Map em memória**: Race conditions em serverless. Supabase RPC é atômico.
5. **Fallback sempre com limites**: Circuit breaker + backoff + max retries.
