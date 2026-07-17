/**
 * Eduka — API Helpers
 * Autenticação, rate limiting ponderado por rota (Supabase), validação de schema (Zod)
 *
 * Rate limit usa Supabase com custo ponderado:
 * - chat, explain, improve: 1 unidade
 * - estudo: 2 unidades
 * - generate, slides, pdf: 3 unidades
 *
 * Cada utilizador tem 30 unidades/hora.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Rate Limiting ponderado por rota ──────────────────────
const RL_MAX_CREDITS = 30;         // créditos por janela
const RL_WINDOW_MS = 60 * 60 * 1000; // 1 hora

// Custo por rota (em créditos)
const ROUTE_COSTS = {
  chat: 1,
  explain: 1,
  improve: 1,
  curriculo: 2,
  estudo: 2,
  generate: 3,
  slides: 3,
  pdf: 3,
};

/**
 * Determina a rota a partir do pathname.
 */
function detectRoute(pathname) {
  const match = pathname.match(/\/api\/(\w+)/);
  return match ? match[1] : "unknown";
}

/**
 * Verifica rate limit do user com custo ponderado.
 * Usa Supabase RPC (increment_rate_limit) para incremento atómico — sem race conditions.
 * Requer que a migration 003_rate_limit_rpc.sql foi executada no Supabase.
 */
async function checkUserRateLimit(userId, route) {
  const adminDb = createAdminClient();
  const cost = ROUTE_COSTS[route] || 1;

  const { data: rpcResult, error: rpcError } = await adminDb
    .rpc("increment_rate_limit", {
      p_user_id: userId,
      p_cost: cost,
      p_window_ms: RL_WINDOW_MS,
    })
    .single();

  if (rpcError) {
    console.error(
      "[RateLimit] RPC increment_rate_limit falhou; operação bloqueada:",
      {
        code: rpcError.code,
        message: rpcError.message,
        userId: userId,
        cost,
      }
    );

    return {
      allowed: false,
      reason: "rate_limit_unavailable",
      retryable: true,
      creditsUsed: null,
      creditsRemaining: null,
      resetIn: null,
      cost,
    };
  }

  const resetIn = RL_WINDOW_MS - (Date.now() - new Date(rpcResult.window_start).getTime());

  return {
    allowed: rpcResult.allowed,
    creditsUsed: rpcResult.credits_used,
    creditsRemaining: RL_MAX_CREDITS - rpcResult.credits_used,
    resetIn: Math.max(resetIn, 0),
    cost,
  };
}

// ─── Autenticação + Rate Limit ──────────────────────────────

/**
 * Autentica o utilizador e aplica rate limit ponderado pela rota.
 * Retorna { user, supabase, error, rateLimit }
 */
export async function authenticateAndRateLimit(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      supabase,
      error: NextResponse.json({ error: "Não autenticado." }, { status: 401 }),
      rateLimit: null,
    };
  }

  // Detectar rota do pathname
  const route = detectRoute(request.nextUrl?.pathname || "");

  // Rate limit com custo ponderado
  const rl = await checkUserRateLimit(user.id, route);
  if (!rl.allowed) {
    if (rl.reason === "rate_limit_unavailable") {
      return {
        user,
        supabase,
        error: NextResponse.json(
          {
            error: "Serviço temporariamente indisponível.",
            code: "RATE_LIMIT_UNAVAILABLE",
          },
          {
            status: 503,
            headers: {
              "Retry-After": "2",
              "Cache-Control": "no-store",
            },
          }
        ),
        rateLimit: rl,
      };
    }

    const minutes = Math.ceil(rl.resetIn / 60000);
    return {
      user,
      supabase,
      error: NextResponse.json(
        {
          error: `Limite de ${RL_MAX_CREDITS} créditos/hora excedido. Tenta novamente em ${minutes} minutos.`,
          code: "RATE_LIMIT_EXCEEDED",
          rateLimit: {
            creditsUsed: rl.creditsUsed,
            creditsRemaining: 0,
            resetInMinutes: minutes,
            routeCost: rl.cost,
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, Math.ceil(rl.resetIn / 1000))),
            "X-RateLimit-Limit": String(RL_MAX_CREDITS),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil((Date.now() + rl.resetIn) / 1000)),
            "Cache-Control": "no-store",
          },
        }
      ),
      rateLimit: rl,
    };
  }

  return { user, supabase, error: null, rateLimit: rl };
}

// ─── Validação de schema com Zod ─────────────────────────────

export function validateSchema(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.issues[0];
    const field = firstError.path.join(".") || "input";
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

// ─── Resposta com headers de rate limit ──────────────────────

/**
 * Adiciona headers de rate limit a uma resposta JSON.
 */
export function withRateLimitHeaders(response, rateLimit) {
  if (!rateLimit) return response;
  response.headers.set("X-RateLimit-Limit", String(RL_MAX_CREDITS));
  response.headers.set("X-RateLimit-Remaining", String(rateLimit.creditsRemaining));
  response.headers.set("X-RateLimit-Used", String(rateLimit.creditsUsed));
  return response;
}

const apiHelpers = {
  authenticateAndRateLimit,
  validateSchema,
  withRateLimitHeaders,
  RL_MAX_CREDITS,
  ROUTE_COSTS,
};

export default apiHelpers;
