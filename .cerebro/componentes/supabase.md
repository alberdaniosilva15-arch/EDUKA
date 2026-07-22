# Supabase — Documentação

> Schema, tabelas, RPCs, e configuração do Supabase.

## Conexão

- **URL**: https://rhfsxncgklklcojqtpfp.supabase.co
- **Client admin**: `lib/supabase/admin.js` (service role)
- **Client server**: `lib/supabase/server.js` (cookies)
- **Client browser**: `lib/supabase/client.js`

## Tabelas

### auth.users (Supabase Auth)
- Gerenciada pelo Supabase
- Tem apenas 1 utilizador (em desenvolvimento)

### user_interactions
```sql
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('generate','improve','explain','slides','estudo','chat','pdf')),
  topic TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX idx_user_interactions_created_at ON user_interactions(created_at DESC);
CREATE INDEX idx_user_interactions_user_created ON user_interactions(user_id, created_at DESC);

-- RLS
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
-- Users veem/inscreem só as suas
-- Service role (admin client) tem acesso total
```

### chat_conversations
```sql
-- Conversas do chat
-- Campos: id, user_id, title, created_at, updated_at
```

### chat_messages
```sql
-- Mensagens do chat
-- Campos: id, conversation_id, role, content, files, model, provider, latency_ms, created_at
```

### rate_limits
```sql
-- Rate limits por user_id
-- Janela de 1 hora
```

### RPC: increment_rate_limit
```sql
-- Função atômica para rate limit
-- Parâmetros: p_user_id, p_window_seconds, p_max_requests
-- Retorna: { allowed: boolean, current_count: integer, window_start: timestamptz }
-- Fallback: se RPC falhar → console.error + allow (nunca expor ao client)
```

## Schema Execution Order

1. `supabase_setup_adjusted.sql` (todas as tabelas base)
2. `002_rate_limits.sql` (tabela de rate limits)
3. `003_rate_limit_rpc.sql` (RPC atômico)

**NOTA**: O nome das tabelas é `chat_conversations` e `chat_messages` (não `conversations`/`messages`) porque TODAS as rotas API já usam estes nomes.

## Verificação via REST API

```bash
# Listar todas as tabelas e RPCs
GET /rest/v1/ → retorna OpenAPI spec com todos os paths

# Query direta (pode dar 404 transitório por caching)
GET /rest/v1/user_interactions?select=*
```

**Dica**: Supabase CLI não funciona em win32-x64. Usar REST API para verificação.

## RLS Policies

- `user_interactions`: users veem/insere só as suas
- `chat_conversations`: users veem/gerenciam só as suas
- `chat_messages`: users veem/insere só as suas (via conversation owner)
- `rate_limits`: service role tem acesso total

## Variáveis de Ambiente

```
NEXT_PUBLIC_SUPABASE_URL=https://rhfsxncgklklcojqtpfp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Bugs Conhecidos

1. **Rate limit in-memory Map**: Cada instância tem Map próprio. Não funciona em serverless.
2. **REST API 404s transitórios**: Query direta pode retornar 404 mesmo com tabela existente (caching/CDN). Usar OpenAPI spec como authoritative.
