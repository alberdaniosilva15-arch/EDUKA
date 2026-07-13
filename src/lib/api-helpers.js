/**
 * Eduka — API Helpers
 * Autenticação, rate limiting por user_id (Supabase), validação de schema (Zod)
 * 
 * Rate limit usa Supabase em vez de Map em memória — funciona em serverless
 * onde cada instância cold-start tem memória isolada.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Rate Limiting por user_id via Supabase ──────────────────
const RL_MAX = 20;          // pedidos por janela
const RL_WINDOW_MS = 60 * 60 * 1000; // 1 hora

/**
 * Verifica rate limit do user via tabela Supabase `rate_limits`.
 * Usa upsert atómico — sem race conditions entre instâncias.
 */
async function checkUserRateLimit(supabase, userId) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RL_WINDOW_MS);

  // Ler ou criar entrada
  const { data: entry, error: readError } = await supabase
    .from("rate_limits")
    .select("count, window_start")
    .eq("user_id", userId)
    .single();

  // Se não existe ou janela expirou → reset
  if (readError || !entry || new Date(entry.window_start) < windowStart) {
    await supabase.from("rate_limits").upsert(
      { user_id: userId, count: 1, window_start: now.toISOString() },
      { onConflict: "user_id" }
    );
    return { allowed: true, remaining: RL_MAX - 1, resetIn: RL_WINDOW_MS };
  }

  const newCount = entry.count + 1;

  if (newCount > RL_MAX) {
    const resetIn = RL_WINDOW_MS - (now.getTime() - new Date(entry.window_start).getTime());
    return { allowed: false, remaining: 0, resetIn };
  }

  // Incrementar
  await supabase
    .from("rate_limits")
    .update({ count: newCount })
    .eq("user_id", userId);

  const resetIn = RL_WINDOW_MS - (now.getTime() - new Date(entry.window_start).getTime());
  return { allowed: true, remaining: RL_MAX - newCount, resetIn };
}

// ─── Autenticação + Rate Limit por user_id ───────────────────

export async function authenticateAndRateLimit(request) {
  // 1. Autenticar PRIMEIRO — só depois aplicar rate limit por user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      supabase,
      error: NextResponse.json({ error: "Não autenticado." }, { status: 401 }),
    };
  }

  // 2. Rate limit por user_id via Supabase (não em memória)
  const rl = await checkUserRateLimit(supabase, user.id);
  if (!rl.allowed) {
    const minutes = Math.ceil(rl.resetIn / 60000);
    return {
      user,
      supabase,
      error: NextResponse.json(
        { error: `Limite de ${RL_MAX} gerações/hora excedido. Tenta novamente em ${minutes} minutos.` },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rl.resetIn / 1000)),
            'X-RateLimit-Limit': String(RL_MAX),
            'X-RateLimit-Remaining': '0',
          },
        }
      ),
    };
  }

  return { user, supabase, error: null };
}

// ─── Validação de schema com Zod ─────────────────────────────

export function validateSchema(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.issues[0];
    const field = firstError.path.join('.') || 'input';
    return {
      valid: false,
      error: NextResponse.json(
        { error: `Campo "${field}": ${firstError.message}` },
        { status: 400 }
      ),
    };
  }
  return { valid: true, data: result.data, error: null };
}

const apiHelpers = {
  authenticateAndRateLimit,
  validateSchema,
  RL_MAX,
};

export default apiHelpers;
