# Estrutura de Diretórios

> O que tem em cada pasta do projeto.

## Raiz

```
eduka/
├── src/                    # Código fonte principal
├── public/                 # Assets estáticos
├── supabase/               # Configuração Supabase
├── scripts/                # Scripts auxiliares
├── tests/                  # Testes E2E
├── .cerebro/               # Knowledge base (este índice)
├── .agents/                # Skills do MiMoCode
├── .mimocode/              # Configuração MiMoCode
├── next.config.mjs         # Configuração Next.js
├── eslint.config.mjs       # Configuração ESLint
├── playwright.config.js    # Configuração Playwright
├── package.json            # Dependências
├── cerebro.md              # Documentação original (legado)
└── .env.local              # Variáveis de ambiente (não commitar)
```

## src/app/ — Rotas e Páginas

```
src/app/
├── api/                    # API Routes (backend)
│   ├── chat/route.js       # Chat multi-provider (201 linhas)
│   ├── generate/route.js   # Gerar trabalhos (44 linhas)
│   ├── slides/route.js     # Gerar slides PPTX (87 linhas)
│   ├── explain/route.js    # Explicar temas (35 linhas)
│   ├── improve/route.js    # Melhorar textos (35 linhas)
│   ├── estudo/route.js     # Planos de estudo (38 linhas)
│   └── pdf/route.js        # Processar PDFs
├── chat/page.js            # UI chat estilo Claude (684 linhas)
├── ferramentas/            # Páginas das ferramentas
│   ├── explicar/page.js
│   ├── melhorar/page.js
│   ├── trabalho/page.js
│   ├── estudo/page.js
│   ├── slides/page.js
│   └── pdf/page.js
├── auth/                   # Autenticação
├── login/page.js           # Login
├── registar/page.js        # Registro
├── page.js                 # Landing page
├── layout.js               # Layout principal
└── globals.css             # Design system (~46KB)
```

## src/lib/ — Bibliotecas

```
src/lib/
├── ai-provider.js          # Router multi-provider (500 linhas) ★
├── api-helpers.js          # Auth + rate limit user_id + Zod (109 linhas)
├── api-schemas.js          # Schemas Zod 6 rotas (160 linhas)
├── utils.js                # sanitizeHtml, sanitizeInput, markdownToHtml (105 linhas)
├── prompts.js              # Prompts básicos 5 ferramentas (140 linhas)
├── quality-prompts.js      # Prompts premium generate+slides (92 linhas)
├── free-models.js          # Registry modelos gratuitos (133 linhas)
├── groq-models.js          # Allowlist 4 modelos Groq (42 linhas)
├── slides-generator.js     # PPTX básico 4 layouts (255 linhas)
├── professional-slides-generator.js  # PPTX profissional 7 layouts (546 linhas)
├── document-export.js      # DOCX + PDF export (409 linhas)
├── learning-system.js      # Tracking interações (94 linhas)
├── pdf-parser.js           # PDF parsing via pdf.js CDN
└── supabase/               # Clients Supabase
    ├── admin.js            # Service role client
    ├── server.js           # Server client (cookies)
    └── client.js           # Browser client
```

## src/components/ — Componentes React

```
src/components/
├── Navbar.js
├── Footer.js
├── Hero.js
└── ... (outros componentes UI)
```

## supabase/ — Configuração

```
supabase/
├── migrations/
│   ├── 001_user_interactions.sql  # Tabela para learning system
│   ├── 002_rate_limits.sql        # Tabela de rate limits
│   └── 003_rate_limit_rpc.sql     # RPC atômico de rate limit
└── setup.sql                      # Schema completo (legado)
```

## Arquivos de Configuração Importantes

| Arquivo | O que controla |
|---------|----------------|
| `next.config.mjs` | CSP, headers de segurança, webpack config |
| `eslint.config.mjs` | Regras de linting (flat config) |
| `playwright.config.js` | Configuração de testes E2E |
| `.env.local` | API keys, URLs (não commitar) |
