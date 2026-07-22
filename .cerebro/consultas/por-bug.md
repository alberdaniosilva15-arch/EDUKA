# Consultas por Bug

> "Qual arquivo causa este problema?" — Índice invertido de bugs.

## Por Componente

### PDF
| Problema | Arquivo | Linha | Status |
|----------|---------|-------|--------|
| pdf.js worker version mismatch | `lib/pdf-parser.js` | 12 | ⏳ PENDENTE |
| PDF inline não funciona no OpenRouter | `lib/ai-provider.js` | — | Workaround: forçar Gemini |
| sanitizeHtml retorna HTML cru em SSR | `lib/utils.js` | 20 | Latente |

### Chat
| Problema | Arquivo | Linha | Status |
|----------|---------|-------|--------|
| hasPdfInImages undefined | `api/chat/route.js` | 172 | ✅ CORRIGIDO |
| System message duplication | `lib/ai-provider.js` | — | ✅ CORRIGIDO |
| Chat schema default 8B | `lib/api-schemas.js` | — | ⏳ PENDENTE |
| localStorage base64 strip | `app/chat/page.js` | — | ✅ CORRIGIDO |
| Chat system prompt hardcoded | `api/chat/stream/route.js` | 45 | ⏳ PENDENTE |
| Streaming rate limit headers | `api/chat/stream/route.js` | — | ✅ CORRIGIDO |
| isVisionModel import unused | `api/chat/stream/route.js` | — | ⏳ PENDENTE |
| lastUserMsg unused | `api/chat/stream/route.js` | — | ⏳ PENDENTE |

### Slides
| Problema | Arquivo | Linha | Status |
|----------|---------|-------|--------|
| Slide preview field mismatch | `app/slides/page.js` | — | ✅ CORRIGIDO |
| PPTX normaliseSlide mapping | `lib/professional-slides-generator.js` | — | ✅ CORRIGIDO |
| Prompt template regex | `lib/quality-prompts.js` | — | ✅ CORRIGIDO |

### Auth / Rate Limit
| Problema | Arquivo | Linha | Status |
|----------|---------|-------|--------|
| Rate limit race condition | `lib/api-helpers.js` | — | ✅ CORRIGIDO (RPC) |
| Rate limit in-memory Map | `lib/api-helpers.js` | — | ⏳ PENDENTE |
| CSRF Origin/Referer check | `middleware.js` | — | ✅ CORRIGIDO |
| Rate limit IP bypassável | `middleware.js` | — | DEFERIDO |

### AI Provider
| Problema | Arquivo | Linha | Status |
|----------|---------|-------|--------|
| `||` vs `??` temperature | `lib/ai-provider.js` | 118 | ✅ CORRIGIDO |
| Gemini URL hardcoded | `lib/ai-provider.js` | 9 | ✅ CORRIGIDO |
| NVIDIA `:free` inválido | `lib/ai-provider.js` | — | ✅ CORRIGIDO |
| NVIDIA custo no fallback | `lib/ai-provider.js` | — | ⏳ PENDENTE |
| generateContentStream messages | `lib/streaming.js` | 25 | ⏳ PENDENTE |

### Build / Config
| Problema | Arquivo | Linha | Status |
|----------|---------|-------|--------|
| Turbopack win32 | `next.config.mjs` | — | Workaround: Webpack |
| ESLint 9 flat config | `eslint.config.mjs` | — | Workaround: lint separado |
| npm install legacy-peer-deps | `package.json` | — | Workaround: flag |

### CSS / Design
| Problema | Arquivo | Linha | Status |
|----------|---------|-------|--------|
| Light mode incompleto | `app/globals.css` | — | ⏳ PENDENTE |
| Dead CSS | `app/globals.css` | — | ⏳ PENDENTE |
| Chat page theme isolation | `app/chat/page.js` | — | ⏳ PENDENTE |

### Geração
| Problema | Arquivo | Linha | Status |
|----------|---------|-------|--------|
| generate/stream hardcoded prompt | `api/generate/stream/route.js` | 45 | ✅ CORRIGIDO |
| quality-prompts não usado no estudo | `api/estudo/route.js` | — | ⏳ PENDENTE |

### Currículo
| Problema | Arquivo | Linha | Status |
|----------|---------|-------|--------|
| error.message exposure | `api/curriculo/route.js` | 155 | ✅ CORRIGIDO |
| Prompt typo | `api/curriculo/route.js` | 71 | ✅ CORRIGIDO |

### Segurança
| Problema | Arquivo | Linha | Status |
|----------|---------|-------|--------|
| XSS via sanitizeHtml SSR | `lib/utils.js` | 20 | Latente |
| Payload base64 66MB | `api/chat/route.js` | — | ⏳ PENDENTE |
| CSP unsafe-eval produção | `next.config.mjs` | — | ⏳ PENDENTE |

### Code Quality
| Problema | Arquivo | Linha | Status |
|----------|---------|-------|--------|
| Dead code: ai-provider.js | `lib/ai-provider.js` | — | ⏳ PENDENTE (371 linhas) |
| Dead code: learning-system.js | `lib/learning-system.js` | — | ⏳ PENDENTE (94 linhas) |
| pdf-lib não está no package.json | `package.json` | — | ⏳ PENDENTE |

## Por Prioridade (revisada)

### P1 — Correções Funcionais (fazer primeiro)
1. ~~generate/stream hardcoded prompt → `api/generate/stream/route.js:45`~~ ✅
2. ~~generateContentStream messages array → `lib/streaming.js:25`~~ ✅
3. ~~curriculo error.message exposure → `api/curriculo/route.js:155`~~ ✅
4. ~~curriculo prompt typo → `api/curriculo/route.js:71`~~ ✅

### P2 — Segurança e Infraestrutura
1. Rate limit serverless → `lib/api-helpers.js`
2. Payload base64 66MB → `api/chat/route.js`
3. NVIDIA custo fallback → `lib/ai-provider.js`
4. sanitizeHtml SSR → `lib/utils.js:20`

### P3 — Melhorias e Limpeza (após testes)
1. Light mode → `app/globals.css`
2. Dead CSS → `app/globals.css`
3. quality-prompts estudo → `api/estudo/route.js`
4. Persistir chat → `app/chat/page.js`
5. CSP dev/prod → `next.config.mjs`
6. Imports/variáveis não usados → Diversos (P3, não P1/P2)
7. Chat schema 8B → `lib/api-schemas.js` (decisão custo/performance)

### P4 — Exclusão Legacy (após confirmação)
> Só após: grep imports dinâmicos + testes + Git history + build + lint
1. ai-provider.js → `lib/ai-provider.js` (371 linhas)
2. learning-system.js → `lib/learning-system.js` (94 linhas)
