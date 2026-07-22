-- ====================================================================================
-- EDUKA — SCHEMA SUPABASE (SaaS Edition)
-- ====================================================================================
-- Este script NÃO apaga dados. Apenas cria tabelas se não existirem (IF NOT EXISTS).
-- Regras aplicadas: cascade, índices, updated_at em todas as tabelas mutáveis, 
-- separação entre perfis e consumos (token_usage). Role do bot alterada para "assistant".
-- RLS rigoroso que cruza sempre por auth.users.id.
-- ====================================================================================

-- 1. Cria a extensão para UUID (caso ainda não exista)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Função global para auto-update do campo updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';


-- ==========================================
-- ESTRUTURA DE TABELAS
-- ==========================================

-- 3. PERFIL DO UTILIZADOR (user_profiles)
-- A chave primária referencia diretamente o auth.users
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text DEFAULT 'free',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Trigger para updated_at no user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- 4. CONSUMO DE TOKENS (token_usage) 
-- Contabilidade estrita por evento, nunca mutável. Evita race conditions de pagamento.
CREATE TABLE IF NOT EXISTS public.token_usage (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model text NOT NULL,
  tokens_prompt integer DEFAULT 0,
  tokens_completion integer DEFAULT 0,
  action_type text NOT NULL, -- ex: 'chat', 'slides', 'pdf', 'trabalho'
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS token_usage_user_id_idx ON public.token_usage(user_id);
CREATE INDEX IF NOT EXISTS token_usage_created_at_idx ON public.token_usage(created_at);


-- 5. INTERAÇÕES E CONTEXTO DE ESTUDO (user_interactions)
-- Memória passiva para alimentar a Persona Eduka
CREATE TABLE IF NOT EXISTS public.user_interactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  topic text NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_interactions_user_id_idx ON public.user_interactions(user_id);


-- 6. HISTÓRICO DE CHAT PERSISTENTE (chat_conversations & chat_messages)
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  model text DEFAULT 'llama-3.1-8b-instant',
  message_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

DROP TRIGGER IF EXISTS update_chat_conversations_updated_at ON public.chat_conversations;
CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS chat_conversations_user_id_idx ON public.chat_conversations(user_id);

-- As mensagens usam explicitamente 'assistant' e não 'ia', conforme instruído
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  model text,
  provider text,
  latency_ms integer,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_conversation_id_idx ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON public.chat_messages(created_at);


-- 7. CONTEÚDOS E TRABALHOS GUARDADOS (saved_documents)
-- Onde guardamos os Slides, Resumos em PDF e Trabalhos para não se perderem (Storage jsonb ou markdown)
CREATE TABLE IF NOT EXISTS public.saved_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('slide', 'work', 'pdf')),
  title text NOT NULL,
  content jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

DROP TRIGGER IF EXISTS update_saved_documents_updated_at ON public.saved_documents;
CREATE TRIGGER update_saved_documents_updated_at
  BEFORE UPDATE ON public.saved_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS saved_documents_user_id_idx ON public.saved_documents(user_id);


-- ==========================================
-- ROW LEVEL SECURITY (RLS) - SEGURANÇA E ACESSO DIRECTO
-- ==========================================
-- Bloqueia a leitura/escrita não autorizada por omissão, obrigando ao uso de Policies baseadas no uuid da sessão.

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_documents ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- POLÍTICAS: user_profiles
-- -----------------------------------------------------
CREATE POLICY "Utilizador gere o próprio perfil (Select)" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Utilizador gere o próprio perfil (Insert)" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Utilizador gere o próprio perfil (Update)" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

-- -----------------------------------------------------
-- POLÍTICAS: token_usage (IMUTÁVEL - Apenas Insert/Select)
-- -----------------------------------------------------
CREATE POLICY "Utilizador insere consumo" ON public.token_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Utilizador acede ao seu consumo" ON public.token_usage FOR SELECT USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- POLÍTICAS: user_interactions
-- -----------------------------------------------------
CREATE POLICY "Acesso as próprias interacções" ON public.user_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Inserir próprias interacções" ON public.user_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------
-- POLÍTICAS: chat_conversations
-- -----------------------------------------------------
CREATE POLICY "Select conversas" ON public.chat_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert conversas" ON public.chat_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update conversas" ON public.chat_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Delete conversas" ON public.chat_conversations FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- POLÍTICAS: chat_messages
-- -----------------------------------------------------
CREATE POLICY "Select mensagens" ON public.chat_messages FOR SELECT USING (
  conversation_id IN (SELECT id FROM public.chat_conversations WHERE user_id = auth.uid())
);
CREATE POLICY "Insert mensagens" ON public.chat_messages FOR INSERT WITH CHECK (
  conversation_id IN (SELECT id FROM public.chat_conversations WHERE user_id = auth.uid())
);
CREATE POLICY "Delete mensagens" ON public.chat_messages FOR DELETE USING (
  conversation_id IN (SELECT id FROM public.chat_conversations WHERE user_id = auth.uid())
);

-- -----------------------------------------------------
-- POLÍTICAS: saved_documents
-- -----------------------------------------------------
CREATE POLICY "Select documentos" ON public.saved_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert documentos" ON public.saved_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update documentos" ON public.saved_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Delete documentos" ON public.saved_documents FOR DELETE USING (auth.uid() = user_id);
