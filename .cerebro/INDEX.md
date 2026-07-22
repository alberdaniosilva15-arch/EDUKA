# INDEX — Knowledge Base Eduka

> Mapa de navegação. Comece aqui para encontrar qualquer informação.
> Última atualização: 2026-07-18

## Como Usar

1. **Debug rápido**: Veja `consultas/por-bug.md` para encontrar o arquivo certo
2. **Novo no projeto**: Leia `arquitetura/stack.md` → `arquitetura/diretorios.md`
3. **Entender fluxo**: Veja `arquitetura/fluxos.md`
4. **Decisões passadas**: Veja `decisoes/arquitetura.md`

---

## Navegação Rápida

### Por Tópico

| Tópico | Arquivo | O que encontra |
|--------|---------|----------------|
| Tech stack | `arquitetura/stack.md` | Next.js, React, Supabase, AI providers |
| Estrutura de pastas | `arquitetura/diretorios.md` | O que tem em cada diretório |
| Fluxos principais | `arquitetura/fluxos.md` | Chat, slides, geração, estudo |
| AI Provider | `componentes/ai-provider.md` | Rotas, fallback, modelos |
| Supabase | `componentes/supabase.md` | Schema, tabelas, RPCs |
| Rotas API | `componentes/rotas-api.md` | Cada rota: o que faz |
| Design system | `componentes/design-system.md` | CSS, temas, variáveis |
| Bugs pendentes | `bugs/pendentes.md` | P1 e P2 ativos |
| Bugs corrigidos | `bugs/corrigidos.md` | Histórico de fixes |
| Decisões | `decisoes/arquitetura.md` | Por que X foi escolhido |

### Por Ação

- **"Quero corrigir um bug"** → `bugs/pendentes.md` → `consultas/por-bug.md`
- **"Quero adicionar feature"** → `arquitetura/fluxos.md` → `componentes/rotas-api.md`
- **"Quero entender o código"** → `arquitetura/diretorios.md` → `consultas/por-arquivo.md`
- **"Quero mudar design"** → `componentes/design-system.md`
- **"Quero mudar AI provider"** → `componentes/ai-provider.md`

---

## Arquivos Grandes (evitar ler completos)

| Arquivo | Linhas | Usar quando |
|---------|--------|-------------|
| `src/lib/ai-provider.js` | ~500 | Problemas com providers AI |
| `src/app/globals.css` | ~46KB | Problemas de design/tema |
| `src/app/chat/page.js` | ~684 | Problemas no chat UI |
| `src/lib/professional-slides-generator.js` | ~546 | Problemas com slides PPTX |

**Dica**: Em vez de ler o arquivo completo, use `consultas/por-arquivo.md` para saber qual seção ler.

---

## Atalhos de Debug

```
Bug no PDF?        → .cerebro/consultas/por-bug.md → "PDF"
Bug no chat?       → .cerebro/consultas/por-bug.md → "Chat"
Bug nos slides?    → .cerebro/consultas/por-bug.md → "Slides"
Bug no login?      → .cerebro/consultas/por-bug.md → "Auth"
Bug no build?      → .cerebro/bugs/pendentes.md → "Build"
```

---

## Status do Projeto

- **Estado**: App funcional, build passa
- **Última revisão**: 2026-07-12
- **Plataforma**: win32, Node.js
- **Supabase**: https://rhfsxncgklklcojqtpfp.supabase.co
