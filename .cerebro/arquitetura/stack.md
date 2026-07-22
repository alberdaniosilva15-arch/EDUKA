# Stack Tecnológica

> Tech stack completa do projeto Eduka.

## Core

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Next.js | 15.3.3 (instalado: 15.5.20) | Framework React (App Router) |
| React | 19.0.0 | UI library |
| Node.js | via .hermes | Runtime |

## Backend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Supabase | @supabase/ssr 0.5.1, @supabase/supabase-js 2.45.0 | Auth + Database |
| Zod | 4.4.3 | Validação de schemas |

## AI Providers (todos free tier)

| Provider | Modelos | Vision |
|----------|---------|--------|
| Groq | llama-3.1-8b-instant, llama-3.3-70b-versatile, gpt-oss-20b, gpt-oss-120b | Não |
| OpenRouter | llama-3.3-70b-instruct:free, nemotron-120b:free, qwen3-coder:free, gemma-4-31b:free, gemma-4-26b:free, nemotron-nano-vl:free | 3 com vision |
| Gemini | gemini-2.5-flash | Sim |
| NVIDIA | nemotron-3-super-120b-a12b, llama-3.3-nemotron-49b | Não |

## Frontend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| GSAP | 3.15.0 + @gsap/react 2.1.2 | Animações |
| Spline | @splinetool/react-spline 4.1.0 | 3D |
| Lenis | 1.3.25 | Smooth scroll |
| next-themes | 0.4.6 | Dark/Light mode |
| marked | 18.0.5 | Markdown → HTML |
| DOMPurify | 3.4.11 | Sanitização HTML |

## Exportação

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| pptxgenjs | 4.0.1 | Gerar slides PPTX |
| docx | 9.7.1 | Gerar documentos DOCX |
| pdfjs-dist | 4.10.38 | Parse de PDFs |

## Dev Tools

| Ferramenta | Versão | Uso |
|------------|--------|-----|
| ESLint | 9.x | Linting (flat config) |
| Playwright | 1.61.1 | Testes E2E |
| TypeScript | 5.7.0 | Type checking |

## Dependências Problemáticas

- `npm install` requer `--legacy-peer-deps` (React 19 peer dep conflicts)
- Turbopack não funciona em win32 (usar Webpack)
- pdf-lib foi instalado mas NÃO está no package.json
