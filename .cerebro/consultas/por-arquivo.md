# Consultas por Arquivo

> "O que este arquivo faz?" — Índice de todos os arquivos principais.

## src/app/api/

| Arquivo | Função | Linhas | Ler quando |
|---------|--------|--------|------------|
| `chat/route.js` | Chat multi-provider com anexos | 201 | Problemas com chat, PDF, imagens |
| `generate/route.js` | Gerar trabalhos académicos | 44 | Problemas com geração |
| `slides/route.js` | Gerar slides PPTX | 87 | Problemas com slides |
| `explain/route.js` | Explicar temas | 35 | Problemas com explicações |
| `improve/route.js` | Melhorar textos | 35 | Problemas com melhoria |
| `estudo/route.js` | Planos de estudo | 38 | Problemas com estudo |
| `pdf/route.js` | Processar PDFs | — | Problemas com PDF |
| `curriculo/route.js` | Gerar currículo | — | Problemas com currículo |
| `chat/stream/route.js` | Chat com streaming | — | Problemas com streaming |
| `generate/stream/route.js` | Geração com streaming | — | Problemas com streaming |

## src/app/

| Arquivo | Função | Linhas | Ler quando |
|---------|--------|--------|------------|
| `chat/page.js` | UI chat estilo Claude | 684 | Problemas com interface do chat |
| `ferramentas/*/page.js` | Páginas das ferramentas | — | Problemas com UI específica |
| `login/page.js` | Login | — | Problemas com autenticação |
| `registar/page.js` | Registro | — | Problemas com registro |
| `page.js` | Landing page | — | Problemas com homepage |
| `layout.js` | Layout principal | — | Problemas com layout |
| `globals.css` | Design system | ~46KB | Problemas com design/tema |

## src/lib/

| Arquivo | Função | Linhas | Ler quando |
|---------|--------|--------|------------|
| `ai-provider.js` | Router multi-provider (LEGADO) | ~500 | Problemas com providers AI |
| `api-helpers.js` | Auth + rate limit user_id | 109 | Problemas com auth/rate limit |
| `api-schemas.js` | Schemas Zod 6 rotas | 160 | Problemas com validação |
| `utils.js` | sanitizeHtml, sanitizeInput, markdownToHtml | 105 | Problemas com sanitização |
| `prompts.js` | Prompts básicos 5 ferramentas | 140 | Problemas com prompts |
| `quality-prompts.js` | Prompts premium generate+slides | 92 | Problemas com qualidade |
| `free-models.js` | Registry modelos gratuitos | 133 | Problemas com modelos |
| `groq-models.js` | Allowlist 4 modelos Groq | 42 | Problemas com Groq |
| `slides-generator.js` | PPTX básico 4 layouts | 255 | Problemas com PPTX básico |
| `professional-slides-generator.js` | PPTX profissional 7 layouts | 546 | Problemas com PPTX profissional |
| `document-export.js` | DOCX + PDF export | 409 | Problemas com exportação |
| `learning-system.js` | Tracking interações | 94 | Problemas com tracking |
| `pdf-parser.js` | PDF parsing via pdf.js CDN | — | Problemas com parse de PDF |

## src/lib/supabase/

| Arquivo | Função | Ler quando |
|---------|--------|------------|
| `admin.js` | Service role client | Problemas com acesso admin |
| `server.js` | Server client (cookies) | Problemas com SSR |
| `client.js` | Browser client | Problemas com cliente |

## src/lib/ai/ (Nova Arquitetura)

| Arquivo | Função | Ler quando |
|---------|--------|------------|
| `model-registry.js` | Registro centralizado de modelos | Problemas com modelos |
| `provider-router.js` | Routing com circuit breaker | Problemas com providers |
| `index.js` | Entry point | Imports da nova arquitetura |
| `systems/base.js` | System prompt base | Problemas com prompts |
| `systems/chat.js` | System prompt chat | Problemas com chat |
| `systems/work.js` | System prompt trabalho | Problemas com geração |
| `systems/slides.js` | System prompt slides | Problemas com slides |
| `systems/explain.js` | System prompt explicação | Problemas com explicações |
| `systems/improve.js` | System prompt melhoria | Problemas com melhoria |
| `systems/study.js` | System prompt estudo | Problemas com estudo |
| `prompts/*.js` | Prompts por ferramenta | Problemas com prompts específicos |
| `schemas/output.js` | Zod schemas output | Problemas com validação output |
| `quality/rubrics.js` | Quality scoring | Problemas com qualidade |

## Supabase

| Arquivo | Função | Ler quando |
|---------|--------|------------|
| `supabase_setup_adjusted.sql` | Schema completo | Problemas com tabelas |
| `002_rate_limits.sql` | Tabela rate limits | Problemas com rate limit |
| `003_rate_limit_rpc.sql` | RPC atômico | Problemas com rate limit atômico |

## Configuração

| Arquivo | Função | Ler quando |
|---------|--------|------------|
| `next.config.mjs` | CSP, headers, webpack | Problemas com config Next.js |
| `eslint.config.mjs` | Regras linting | Problemas com ESLint |
| `playwright.config.js` | Config testes | Problemas com testes |
| `package.json` | Dependências | Problemas com dependências |
