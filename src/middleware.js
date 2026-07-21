/**
 * Eduka — Middleware de Segurança
 * Rate limiting + proteção de rotas + headers de segurança
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Rate limit store em memória (mesmo do rate-limit.js)
const rateLimitStore = new Map();

// Limpeza periódica do store para evitar crescimento indefinido
let lastRateLimitCleanup = 0;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

function pruneRateLimitStore(now = Date.now()) {
  if (now - lastRateLimitCleanup < CLEANUP_INTERVAL_MS) return;
  lastRateLimitCleanup = now;
  for (const [key, entry] of rateLimitStore) {
    const expiresAt = (entry.resetTime || 0) + (entry.blockMs || entry.blockedUntil ? (entry.blockedUntil || 0) - now : 0);
    if (now > (entry.blockedUntil || entry.resetTime || 0)) {
      rateLimitStore.delete(key);
    }
  }
}

// Configurações
const RATE_CONFIG = {
  auth: { max: 5, windowMs: 15 * 60 * 1000, blockMs: 30 * 60 * 1000 },
  api: { max: 30, windowMs: 60 * 1000, blockMs: 5 * 60 * 1000 },
  general: { max: 100, windowMs: 60 * 1000, blockMs: 10 * 60 * 1000 },
};

function checkRateLimit(key, type = 'general') {
  const config = RATE_CONFIG[type] || RATE_CONFIG.general;
  const now = Date.now();

  // Limpar entradas expiradas periodicamente
  pruneRateLimitStore(now);

  const storeKey = `${type}:${key}`;
  const entry = rateLimitStore.get(storeKey);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(storeKey, { count: 1, resetTime: now + config.windowMs, blockedUntil: 0 });
    return { allowed: true, remaining: config.max - 1 };
  }

  if (entry.blockedUntil && now < entry.blockedUntil) {
    return { allowed: false, remaining: 0, resetIn: entry.blockedUntil - now };
  }

  entry.count++;
  if (entry.count > config.max) {
    entry.blockedUntil = now + config.blockMs;
    return { allowed: false, remaining: 0, resetIn: config.blockMs };
  }

  return { allowed: true, remaining: config.max - entry.count };
}

/**
 * Obtém IP do cliente — LIMITAÇÃO CONHECIDA:
 * x-forwarded-for e x-real-ip sao facilmente spoofaveis por atacantes.
 * A defesa PRINCIPAL contra abuso e o rate limit por user_id (api-helpers.js),
 * que e atomico e nao depende de headers. Este rate limit por IP e apenas
 * uma camada extra pré-autenticação para reduzir abuso anónimo.
 */
function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function middleware(request) {
  try {
    const ip = getClientIp(request);
    const pathname = request.nextUrl.pathname;

    // 1. Rate limiting por tipo de rota
    let rateType = 'general';
    if (pathname.startsWith('/api/')) rateType = 'api';
    if (pathname.includes('/login') || pathname.includes('/registar') || pathname.includes('/auth/')) {
      rateType = 'auth';
    }

    const rateResult = checkRateLimit(ip, rateType);
    if (!rateResult.allowed) {
      const minutes = Math.ceil((rateResult.resetIn || 60000) / 60000);
      return NextResponse.json(
        { error: `Demasiados pedidos. Tenta novamente em ${minutes} minutos.` },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateResult.resetIn || 60000) / 1000)),
            'X-RateLimit-Limit': String(rateType === 'auth' ? RATE_CONFIG.auth.max : RATE_CONFIG.api.max),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // 2. Bloquear métodos perigosos
    const blockedMethods = ['TRACE', 'TRACK', 'DEBUG'];
    if (blockedMethods.includes(request.method)) {
      return NextResponse.json({ error: 'Método não permitido.' }, { status: 405 });
    }

    // 3. Supabase session handling
    let supabaseResponse = NextResponse.next({ request });

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error(`Missing Supabase Env Vars. URL: ${!!process.env.NEXT_PUBLIC_SUPABASE_URL}, Key: ${!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`);
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 4. Proteger rotas autenticadas
    const protectedPaths = ["/ferramentas", "/chat"];
    const isProtected = protectedPaths.some((path) =>
      pathname.startsWith(path)
    );

    if (isProtected && !user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 5. Bloquear logout via GET (CSRF protection)
    if (pathname === '/auth/logout' && request.method === 'GET') {
      return NextResponse.json(
        { error: 'Logout requer método POST.' },
        { status: 405 }
      );
    }

    // 6. CSRF Origin/Referer check para POSTs de API
    // Exceção: /api/webhooks/* (webhooks de pagamento usam assinatura criptográfica, mais forte)
    if (request.method === 'POST' && pathname.startsWith('/api/') && !pathname.startsWith('/api/webhooks/')) {
      const origin = request.headers.get('origin');
      const referer = request.headers.get('referer');
      const allowedHost = new URL(request.url).host;

      const isValidOrigin = origin && new URL(origin).host === allowedHost;
      const isValidReferer = referer && new URL(referer).host === allowedHost;

      if (!isValidOrigin && !isValidReferer) {
        return NextResponse.json(
          { error: 'Origem inválida.' },
          { status: 403 }
        );
      }
    }

    // 7. Adicionar headers de resposta de segurança extras
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      supabaseResponse.headers.set('X-Request-ID', crypto.randomUUID());
    } else {
      supabaseResponse.headers.set('X-Request-ID', Date.now().toString());
    }

    return supabaseResponse;
  } catch (error) {
    console.error('Middleware Error:', error);
    return NextResponse.json({
      error: "MIDDLEWARE_ERROR",
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
