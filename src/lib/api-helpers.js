/**
 * Eduka — API Helpers
 * Autenticação, rate limiting por user_id, validação de schema (Zod)
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Rate Limiting por user_id ───────────────────────────────
// IP é fácil de rodar. user_id da sessão Supabase não.
// 20 gerações/hora por utilizador, janela deslizante em memória.

const RL_STORE = new Map(); // key → { count, windowStart }
const RL_MAX = 20;          // pedidos por janela
const RL_WINDOW_MS = 60 * 60 * 1000; // 1 hora

// Cleanup a cada 10 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of RL_STORE) {
      if (now - v.windowStart > RL_WINDOW_MS) RL_STORE.delete(k);
    }
  }, 10 * 60 * 1000);
}

function checkUserRateLimit(userId) {
  const now = Date.now();
  const entry = RL_STORE.get(userId);

  if (!entry || now - entry.windowStart > RL_WINDOW_MS) {
    RL_STORE.set(userId, { count: 1, windowStart: now });
    return { allowed: true, remaining: RL_MAX - 1, resetIn: RL_WINDOW_MS };
  }

  entry.count++;
  RL_STORE.set(userId, entry);

  if (entry.count > RL_MAX) {
    const resetIn = RL_WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, remaining: 0, resetIn };
  }

  return { allowed: true, remaining: RL_MAX - entry.count, resetIn: RL_WINDOW_MS - (now - entry.windowStart) };
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

  // 2. Rate limit por user_id (não por IP)
  const rl = checkUserRateLimit(user.id);
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
