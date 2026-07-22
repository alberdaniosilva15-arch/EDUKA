# Bugs Pendentes

> Bugs ativos classificados por prioridade. Última atualização: 2026-07-18
> Priorização revisada: foco em correções funcionais antes de limpeza.

## P1 — Correções Funcionais (fazer primeiro)

| ID | Bug | Arquivo | Linha | Impacto | Nota |
|----|-----|---------|-------|---------|------|
| — | generate/stream hardcoded system prompt | `api/generate/stream/route.js` | 45 | Respostas sem regras | ✅ CORRIGIDO — importa WORK_SYSTEM |
| — | generateContentStream não aceita messages array | `lib/streaming.js` | 25-28 | Perde contexto | ✅ CORRIGIDO — aceita messages option |
| — | curriculo/route.js expõe error.message | `api/curriculo/route.js` | 155 | Vazamento info | ✅ CORRIGIDO — mensagem genérica |
| — | curriculo prompt typo | `api/curriculo/route.js` | 71 | Prompt incorreto | ✅ CORRIGIDO — "a.Resume" → "Resume" |

## P2 — Segurança e Infraestrutura

| ID | Bug | Arquivo | Linha | Impacto | Nota |
|----|-----|---------|-------|---------|------|
| — | Rate limit em memória não funciona em serverless | `lib/api-helpers.js` | — | Rate limit ineficaz | Cada instância tem Map próprio |
| — | Payload base64 pode derrubar API | `api/chat/route.js` | — | Crash | 5×10MB = 66MB. Upload p/ Supabase Storage |
| — | NVIDIA pode custar dinheiro no fallback | `lib/ai-provider.js` | — | Custo | Remover do fallback chain ou controlar com flag |
| — | sanitizeHtml retorna HTML cru em SSR | `lib/utils.js` | 20 | XSS potencial | Latente, todas chamadas são "use client" hoje |

## P3 — Melhorias e Limpeza (após testes)

| ID | Item | Arquivo | Nota |
|----|------|---------|------|
| — | Light mode incompleto | `app/globals.css` | `[data-theme='light']` só 5 variáveis |
| — | Dead CSS | `app/globals.css` | .footer-grid, .footer-brand, .footer-col, .footer-angola |
| — | quality-prompts para estudo | `api/estudo/route.js` | Usa prompts.js, não quality-prompts.js |
| — | Persistir chat no Supabase | `app/chat/page.js` | Hoje usa só localStorage |
| — | CSP separada dev/produção | `next.config.mjs` | unsafe-eval não deve ir para produção |
| — | Imports/variáveis não usados | Diversos | P3 — limpeza, não correção |
| — | Chat schema default 8B | `lib/api-schemas.js` | Decisão custo/performance, não bug |

## P4 — Exclusão de Legacy (após confirmação completa)

> **ATENÇÃO**: Só após confirmar:
> 1. Sem imports dinâmicos (grep/ripgrep)
> 2. Sem testes que referenciem
> 3. Sem histórico Git relevante
> 4. Build passa sem o arquivo
> 5. Lint passa sem o arquivo

| ID | Arquivo | Linhas | Verificar antes de apagar |
|----|---------|--------|---------------------------|
| — | `lib/ai-provider.js` | 371 | Grep por imports dinâmicos, testes, referências em configs |
| — | `lib/learning-system.js` | 94 | Grep por imports dinâmicos, referências em rotas |

## Fluxo de Trabalho Recomendado

```
1. Corrigir P1 (generate/stream, streaming messages, error exposure)
2. Rodar testes de regressão
3. Rodar build
4. Rodar lint
5. Só então considerar P3 e P4
```

## Bugs Conhecidos (corrigidos)

| Bug | Arquivo | Status |
|-----|---------|--------|
| hasPdfInImages undefined | `api/chat/route.js:172` | ✅ CORRIGIDO |
| Rate limit race condition | `lib/api-helpers.js` | ✅ CORRIGIDO (RPC atômico) |
| Streaming rate limit headers | `api/chat/stream/` | ✅ CORRIGIDO |
| sanitizeInput marker filtering | `lib/utils.js` | ✅ CORRIGIDO |
| CSRF Origin/Referer check | `middleware.js` | ✅ CORRIGIDO |
| localStorage base64 strip | `app/chat/page.js` | ✅ CORRIGIDO |
| Database tables missing | Supabase | ✅ CORRIGIDO (executado) |
| Slide preview field mismatch | `app/slides/page.js` | ✅ CORRIGIDO |
| PPTX normaliseSlide mapping | `lib/professional-slides-generator.js` | ✅ CORRIGIDO |
| Prompt template regex | `lib/quality-prompts.js` | ✅ CORRIGIDO |
| System message duplication | `lib/ai-provider.js` | ✅ CORRIGIDO |
