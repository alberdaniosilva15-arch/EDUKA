# Decisões de Arquitetura

> Por que cada escolha foi feita. O "porquê" importa mais que o "o quê".

## Decisões Fundamentais

### Rate limit por user_id, não IP
- **Decisão**: Usar user_id (via Supabase auth) em vez de IP
- **Porquê**: IP é trivialmente burlável com VPN
- **Implementação**: Dual rate limit — middleware (IP, geral) + api-helpers (user_id, AI)
- **Limite**: 20 gerações/hora/utilizador

### Single CSS file para design system
- **Decisão**: `globals.css` (~46KB) com todas as variáveis e estilos
- **Porquê**: Facilita manutenção, evita especificidade CSS
- **Trade-off**: Arquivo grande, mas organizado com seções

### Webpack over Turbopack
- **Decisão**: `next.config.mjs` usa Webpack
- **Porquê**: Turbopack native binaries não suportam win32/x64 neste ambiente
- **Alternativa futura**: Quando Turbopack suportar win32

### ESLint ignored during builds
- **Decisão**: ESLint 9 flat config não é serializada pelo Next.js
- **Porquê**: Incompatibilidade entre ESLint 9 e Next.js legacy serialization
- **Workaround**: Linting via `npm run lint` separadamente

### Chat: Groq por padrão
- **Decisão**: Groq como provider padrão para chat
- **Porquê**: Rápido e gratuito
- **Política do utilizador**: "nas execucções todas mete sempre a opcção ultra rapida(groq)"

### PDFs forçados para Gemini
- **Decisão**: Quando há PDFs, usar Gemini independentemente da seleção
- **Porquê**: OpenRouter Vision não suporta PDF inlineData
- **Exceção**: Texto puro pode usar qualquer provider

### Português de Angola/Portugal
- **Decisão**: Todo conteúdo em português
- **Porquê**: Público-alvo são estudantes angolanos

## Decisões de Segurança

### DOMPurify para XSS
- **Decisão**: Usar DOMPurify em vez de sanitização manual
- **Porquê**: Padrão da indústria, bem testado, atualizado regularmente

### Logout apenas POST
- **Decisão**: Logout requer POST, não GET
- **Porquê**: CSRF protection — prevent logout via link malicioso

### CSP completa
- **Decisão**: Content-Security-Policy com todos os headers
- **Porquê**: Defense in depth contra XSS, injection, clickjacking

### sanitizeInput é mínimo
- **Decisão**: sanitizeInput apenas trim/limita, não faz filtro pesado
- **Porquê**: Defesa primária é estrutural (system/user separation no provider-router)

## Decisões de Performance

### Geração: prompts estruturados
- **Decisão**: Usar schemas JSON para output da IA
- **Porquê**: Validação determinística antes de retry
- **Trade-off**: Mais complexo, mas mais confiável

### Dual rate limit
- **Decisão**: Middleware (IP) + api-helpers (user_id)
- **Porquê**: Middleware protege contra DDoS; api-helpers protege contra abuso de API

### Circuit breaker no AI provider
- **Decisão**: 3 falhas consecutivas → open circuit por 60s
- **Porquê**: Evita cascata de falhas, dá tempo para provider recuperar

## Decisões de UX

### Chat estilo Claude
- **Decisção**: UI de chat com interface familiar
- **Porquê**: Usuários conhecem este padrão

### Liquid glass aesthetic
- **Decisção**: Glassmorphism premium com dark mode
- **Porquê**: Visual moderno e profissional

### Dual slides generator
- **Decisção**: `slides-generator.js` (básico) + `professional-slides-generator.js` (profissional)
- **Porquê**: Flexibilidade — rápido vs qualidade

## Decisões de Migração

### Manter ai-provider.js legado
- **Decisão**: Não deletar ai-provider.js mesmo após criar nova arquitetura
- **Porquê**: Backward compatibility para callers existentes
- **Nova arquitetura**: `src/lib/ai/` com model-registry, provider-router, etc.

### free-models.js como re-export layer
- **Decisão**: free-models.js importa de model-registry.js
- **Porquê**: Old callers continuam funcionando

### Route meta block pattern
- **Decisão**: Cada rota retorna `{ data, meta: { provider, model, latencyMs, quality? } }`
- **Porquê**: Frontend pode mostrar provider real após fallback e métricas de qualidade
