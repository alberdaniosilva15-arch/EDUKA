# Consultas por Função

> "Onde está esta funcionalidade?" — Índice por funcionalidade.

## Autenticação

| Funcionalidade | Arquivo | Função/Linha |
|----------------|---------|--------------|
| Login | `app/login/page.js` | UI de login |
| Registro | `app/registar/page.js` | UI de registro |
| Session refresh | `middleware.js` | Supabase session via cookies |
| Auth check | `lib/api-helpers.js` | `authenticateAndRateLimit()` |
| Protected routes | `middleware.js` | Redirect /ferramentas e /chat → /login |
| Logout | `middleware.js` | Apenas POST (CSRF) |

## AI / Providers

| Funcionalidade | Arquivo | Função/Linha |
|----------------|---------|--------------|
| Gerar conteúdo | `lib/ai-provider.js` | `generateContent()` |
| Chamar vision | `lib/ai-provider.js` | `callVision()` |
| Selecionar provider | `lib/ai-provider.js` | `getProviderForModel()` |
| Fallback chain | `lib/ai-provider.js` | Interno em `generateContent()` |
| Circuit breaker | `lib/provider-router.js` | 3 falhas → open 60s |
| Modelos disponíveis | `lib/model-registry.js` | `MODELS`, `PROVIDERS` |
| URL Gemini dinâmica | `lib/ai-provider.js` | `getGeminiUrl(model)` |

## Rate Limiting

| Funcionalidade | Arquivo | Função/Linha |
|----------------|---------|--------------|
| IP rate limit | `middleware.js` | Map em memória |
| User rate limit | `lib/api-helpers.js` | `authenticateAndRateLimit()` |
| RPC atômico | `supabase/migrations/003_rate_limit_rpc.sql` | `increment_rate_limit` |
| Headers | `lib/api-helpers.js` | `withRateLimitHeaders()` |

## Validação

| Funcionalidade | Arquivo | Função/Linha |
|----------------|---------|--------------|
| Input schemas | `lib/api-schemas.js` | Zod schemas para cada rota |
| Output schemas | `lib/schemas/output.js` | Validação de output da IA |
| sanitizeInput | `lib/utils.js` | `sanitizeInput()` |
| sanitizeHtml | `lib/utils.js` | `sanitizeHtml()` |

## Chat

| Funcionalidade | Arquivo | Função/Linha |
|----------------|---------|--------------|
| UI chat | `app/chat/page.js` | 684 linhas |
| API chat | `api/chat/route.js` | 201 linhas |
| Streaming chat | `api/chat/stream/route.js` | Streaming |
| System prompt chat | `lib/systems/chat.js` | `CHAT_SYSTEM` |
| Anexos no chat | `api/chat/route.js` | Files extraction |
| PDF no chat | `api/chat/route.js` | Força Gemini |

## Slides

| Funcionalidade | Arquivo | Função/Linha |
|----------------|---------|--------------|
| UI slides | `app/ferramentas/slides/page.js` | Página |
| API slides | `api/slides/route.js` | 87 linhas |
| Gerar PPTX básico | `lib/slides-generator.js` | 4 layouts |
| Gerar PPTX profissional | `lib/professional-slides-generator.js` | 7 layouts |
| Prompts slides | `lib/quality-prompts.js` | `buildPremiumSlidesPrompt()` |
| Quality scoring | `lib/schemas/output.js` | `scoreSlides()` |
| System prompt slides | `lib/systems/slides.js` | `SLIDES_SYSTEM` |

## Geração de Trabalhos

| Funcionalidade | Arquivo | Função/Linha |
|----------------|---------|--------------|
| UI trabalho | `app/ferramentas/trabalho/page.js` | Página |
| API generate | `api/generate/route.js` | 44 linhas |
| Prompts generate | `lib/quality-prompts.js` | `buildPremiumWorkPrompt()` |
| System prompt work | `lib/systems/work.js` | `WORK_SYSTEM` |

## Explicar

| Funcionalidade | Arquivo | Função/Linha |
|----------------|---------|--------------|
| UI explicar | `app/ferramentas/explicar/page.js` | Página |
| API explain | `api/explain/route.js` | 35 linhas |
| Prompts explain | `lib/prompts.js` | `buildExplainPrompt()` |
| System prompt explain | `lib/systems/explain.js` | `EXPLAIN_SYSTEM` |

## Melhorar

| Funcionalidade | Arquivo | Função/Linha |
|----------------|---------|--------------|
| UI melhorar | `app/ferramentas/melhorar/page.js` | Página |
| API improve | `api/improve/route.js` | 35 linhas |
| Prompts improve | `lib/prompts.js` | `buildImprovePrompt()` |
| System prompt improve | `lib/systems/improve.js` | `IMPROVE_SYSTEM` |

## Estudo

| Funcionalidade | Arquivo | Função/Linha |
|----------------|---------|--------------|
| UI estudo | `app/ferramentas/estudo/page.js` | Página |
| API estudo | `api/estudo/route.js` | 38 linhas |
| Prompts estudo | `lib/prompts.js` | `buildStudyPrompt()` |
| System prompt study | `lib/systems/study.js` | `STUDY_SYSTEM` |

## PDF

| Funcionalidade | Arquivo | Função/Linha |
|----------------|---------|--------------|
| UI pdf | `app/ferramentas/pdf/page.js` | Página |
| API pdf | `api/pdf/route.js` | Processamento |
| Parse PDF | `lib/pdf-parser.js` | Via pdf.js CDN |
| System prompt pdf | `lib/systems/pdf.js` | `PDF_SYSTEM` |

## Exportação

| Funcionalidade | Arquivo | Função/Linha |
|----------------|---------|--------------|
| Exportar DOCX | `lib/document-export.js` | `exportToDocx()` |
| Exportar PDF | `lib/document-export.js` | `exportToPdf()` |

## Segurança

| Funcionalidade | Arquivo | Função/Linha |
|----------------|---------|--------------|
| CSP headers | `next.config.mjs` | Content-Security-Policy |
| HSTS | `next.config.mjs` | Strict-Transport-Security |
| X-Frame-Options | `next.config.mjs` | DENY |
| CSRF | `middleware.js` | Origin/Referer check |
| XSS | `lib/utils.js` | DOMPurify |

## Design System

| Funcionalidade | Arquivo | Função/Linha |
|----------------|---------|--------------|
| CSS variables | `app/globals.css` | `:root` |
| Dark mode | `app/globals.css` | Default |
| Light mode | `app/globals.css` | `[data-theme='light']` |
| Theme provider | `app/layout.js` | next-themes |
| Animações | Componentes | GSAP |
| Smooth scroll | `app/layout.js` | Lenis |
| 3D | Componentes | Spline |
