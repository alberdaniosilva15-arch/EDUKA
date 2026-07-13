# CEREBRO EDUKA
> Última revisão: 2026-07-12 23:50 UTC
> Estado: App funcional, build passa, correções P0 aplicadas

---

## STACK
Next.js 15 (App Router) | React 19 | Supabase Auth+DB | GSAP | Spline 3D | AI: Groq+OpenRouter+Gemini+NVIDIA

## ESTRUTURA
```
src/
  app/
    api/
      chat/route.js        — Chat multi-provider (201 linhas)
      generate/route.js    — Gerar trabalhos (44 linhas)
      slides/route.js      — Gerar slides PPTX (87 linhas)
      explain/route.js     — Explicar temas (35 linhas)
      improve/route.js     — Melhorar textos (35 linhas)
      estudo/route.js      — Planos de estudo (38 linhas)
    chat/page.js           — UI chat estilo Claude (684 linhas)
    ferramentas/
      explicar/page.js
      melhorar/page.js
      trabalho/page.js
      estudo/page.js
      slides/page.js
      pdf/page.js
    login/page.js
    registar/page.js
    page.js                — Landing page
    layout.js
    globals.css            — Design system (~46KB)
  lib/
    ai-provider.js         — Router multi-provider (500 linhas) ★
    api-helpers.js         — Auth + rate limit user_id + Zod (109 linhas)
    api-schemas.js         — Schemas Zod 6 rotas (160 linhas)
    utils.js               — sanitizeHtml, sanitizeInput, markdownToHtml (105 linhas)
    prompts.js             — Prompts básicos 5 ferramentas (140 linhas)
    quality-prompts.js     — Prompts premium generate+slides (92 linhas)
    free-models.js         — Registry 13 modelos gratuitos (133 linhas)
    groq-models.js         — Allowlist 4 modelos Groq (42 linhas)
    slides-generator.js    — PPTX básico 4 layouts (255 linhas)
    professional-slides-generator.js — PPTX profissional 7 layouts (546 linhas)
    document-export.js     — DOCX + PDF export (409 linhas)
    learning-system.js     — Tracking interações (94 linhas)
    pdf-parser.js          — PDF parsing via pdf.js CDN
    supabase/admin.js      — Service role client
    supabase/server.js     — Server client (cookies)
    supabase/client.js     — Browser client
  middleware.js            — Rate limit IP + proteção rotas (141 linhas)
  components/              — Navbar, Footer, Hero, etc.
supabase/migrations/
  001_user_interactions.sql — Tabela para learning system
```

---

## AI PROVIDER — ROTAS E FALLBACK
```
generateContent(prompt, opts) → fallback chain: selected → openrouter → groq → nvidia → gemini
callVision(msgs, images, opts) → gemini (inlineData) ou openrouter (image_url)
chat/route.js → getProviderForModel() → chama provider direto (sem fallback chain)
```

### Modelos por provider
| Provider   | Modelos                                             | Vision |
|------------|-----------------------------------------------------|--------|
| Groq       | llama-3.1-8b-instant, llama-3.3-70b-versatile, gpt-oss-20b, gpt-oss-120b | Não |
| OpenRouter | llama-3.3-70b-instruct:free, gpt-oss-120b:free, nemotron-120b:free, qwen3-coder:free, gemma-4-31b:free, gemma-4-26b:free, nemotron-nano-vl:free | 3 com vision |
| Gemini     | gemini-2.0-flash                                    | Sim |
| NVIDIA     | nemotron-3-super-120b-a12b, llama-3.3-nemotron-49b | Não |

### Fluxo chat com anexos
```
1. Extrair files do request ANTES do Zod
2. Validar MIME (image/png, jpeg, webp, application/pdf)
3. Se tem PDFs → forçar Gemini (OpenRouter não suporta PDF inline)
4. Se tem imagens → provider selecionado (inlineData p/ Gemini, image_url p/ OpenRouter)
5. Se não tem ficheiros → chamar provider direto
```

---

## SEGURANÇA IMPLEMENTADA

### Middleware (src/middleware.js)
- Rate limit IP: auth 5/15min, api 30/1min, general 100/1min
- Bloqueia TRACE/TRACK/DEBUG
- Supabase session refresh via cookies
- Protege /ferramentas e /chat (redirect p/ /login)
- Logout apenas POST (CSRF)
- X-Request-ID header

### API Routes (api-helpers.js)
- authenticateAndRateLimit(): auth Supabase + rate limit por user_id (20/hora, Map em memória)
- validateSchema(): Zod safeParse com erros em português

### Headers (next.config.mjs)
- CSP completa com Spline domains
- HSTS, X-Frame-Options: DENY, nosniff
- Sem x-powered-by

### Input
- sanitizeInput(): limita quebras + trim + 5000 chars
- sanitizeHtml(): DOMPurify com whitelist de tags
- chatSchema: valida MIME, max 5 ficheiros, max 6000 chars/mensagem

---

## MODIFICAÇÕES FEITAS (2026-07-12)

### ai-provider.js
| Linha | Antes | Depois | Porquê |
|-------|-------|--------|--------|
| 9-13 | `GEMINI_API_URL = .../gemini-2.0-flash:generateContent` | `GEMINI_BASE_URL = .../models` + `getGeminiUrl(model)` | URL dinâmica por modelo |
| 15 | — | `GEMINI_MODEL_ALLOWLIST = [...]` | Validar modelos Gemini |
| 118-119 | `options.temperature \|\| 0.7` | `options.temperature ?? 0.7` | `||` substitui 0 por 0.7 |
| 124 | `GEMINI_API_URL` | `getGeminiUrl(model)` | Usar URL dinâmica |
| 156-157 | `options.temperature \|\| 0.7` | `options.temperature ?? 0.7` | Mesma correção |
| 161-163 | — | `body.systemInstruction = ...` | System prompt nativo Gemini |
| 166 | `GEMINI_API_URL` | `getGeminiUrl(model)` | URL dinâmica |

### chat/route.js
| Mudança | Detalhe |
|---------|---------|
| Provider routing | De `includes(":free")` para `getProviderForModel()` |
| PDF handling | Força Gemini se houver PDFs; OpenRouter recebe apenas imagens |
| Imagens por provider | Gemini: `inlineData`, OpenRouter: `image_url` (data URL) |
| Ficheiro extraction | `rawFiles` extraído antes do Zod, mapeado manualmente |

### slides/route.js
| Antes | Depois |
|-------|--------|
| `includes(":free") ? "openrouter" : includes("gemini") ? "gemini" : "groq"` | `getProviderForModel(data.model)` |

### estudo/route.js
| Mudança | Detalhe |
|---------|---------|
| Schema | Adicionado campo `model` com default |
| Roteamento | Passa `provider` e `model` para `generateContent()` |

### api-schemas.js
| Mudança | Detalhe |
|---------|---------|
| estudoSchema | Adicionado `model: z.string().max(200).optional().default(...)` |

---

## SUPABASE — TABELA CRIADA

**Arquivo:** `supabase/migrations/001_user_interactions.sql`

```sql
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('generate','improve','explain','slides','estudo','chat','pdf')),
  topic TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX idx_user_interactions_created_at ON user_interactions(created_at DESC);
CREATE INDEX idx_user_interactions_user_created ON user_interactions(user_id, created_at DESC);

ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
-- RLS: users veem/inscreem só as suas
-- Service role (admin client) tem acesso total
```

**Para aplicar:** Colar no SQL Editor do Supabase Dashboard → https://supabase.com/dashboard → Projeto → SQL Editor → Run

---

## BUGS PENDENTES (não corrigidos ainda)

### P1 — Importantes
| ID | Bug | Arquivo | Nota |
|----|-----|---------|------|
| M3 | pdf.js worker v4.0.379 vs pdfjs-dist ^4.0.38 | pdf-parser.js | CDN incompatível, CSP sem worker-src |
| — | sanitizeHtml retorna HTML cru em SSR | utils.js:20 | Latente, todas chamadas são "use client" hoje |
| — | Rate limit em memória não funciona em serverless | api-helpers.js | Cada instância tem Map próprio |
| — | Payload base64 pode derrubar API (5×10MB = 66MB) | chat/route.js | Upload direto p/ Supabase Storage seria melhor |
| — | NVIDIA pode custar dinheiro no fallback | ai-provider.js | Remover do fallback chain ou controlar com flag |

### P2 — Melhorias
| ID | Item | Nota |
|----|------|------|
| — | Light mode incompleto | [data-theme='light'] só 5 variáveis |
| — | Dead CSS | .footer-grid, .footer-brand, .footer-col, .footer-angola |
| — | Streaming no chat | Planeado, não implementado |
| — | quality-prompts para estudo | estudo usa prompts.js, não quality-prompts.js |
| — | Persistir chat no Supabase | Hoje usa só localStorage |
| — | CSP separada dev/produção | unsafe-eval não deve ir para produção |

---

## DECISÕES DE DESIGN
- Rate limit por user_id (não IP — burlável com VPN)
- 20 gerações/hora/utilizador
- MAX_THEME/MAX_TEXT = 5000 chars (proteção custo API)
- Chat: Groq por padrão (rápido, free)
- PDFs: forçados para Gemini (único que aceita inline)
- Dual rate limit: middleware (IP, geral) + api-helpers (user_id, AI)
- Português de Angola/Portugal em todo conteúdo

## DEPENDÊNCIAS NOTAVEIS
- `npm install` requer `--legacy-peer-deps` (React 19 RC)
- Turbopack não funciona em win32
- pdf-lib foi instalado mas NÃO está no package.json (usado por document-export.js? → Não, usa iframe.print)
- marked v18 para markdown→HTML
- docx v9 para exportação DOCX
- pptxgenjs v4 para slides PPTX
- zod v4.4.3 para validação

## AMBIENTE
- Dev: `npx next dev` em localhost:3000
- Build: `npx next build` (passes limpo, 24 páginas, ~31s)
- Supabase: https://rhfsxncgklklcojqtpfp.supabase.co
- Plataforma: win32, Node.js via .hermes
