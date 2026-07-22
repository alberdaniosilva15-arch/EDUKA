/**
 * Eduka — Middleware de Segurança (Edge-safe)
 * Rate limiting + proteção de rotas + headers de segurança
 * 
 * NOTA: Este middleware corre no Vercel Edge Runtime.
 * Todas as APIs usadas devem ser Edge-compatíveis.
 */
import { NextResponse } from "next/server";

// ─── Rate Limit (in-memory, per-isolate) ───────────────────
const rateLimitStore = new Map();
let lastCleanup = 0;
const CLEANUP_INTERVAL = 5 * 60 * 1000;

function pruneStore(now) {
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore) {
    if (now > (entry.blockedUntil || entry.resetTime || 0)) {
      rateLimitStore.delete(key);
    }
  }
}

const RATE_CONFIG = {
  auth:    { max: 5,   windowMs: 15 * 60 * 1000, blockMs: 30 * 60 * 1000 },
  api:     { max: 30,  windowMs: 60 * 1000,       blockMs: 5 * 60 * 1000  },
  general: { max: 100, windowMs: 60 * 1000,       blockMs: 10 * 60 * 1000 },
};

function checkRateLimit(key, type = "general") {
  const config = RATE_CONFIG[type] || RATE_CONFIG.general;
  const now = Date.now();
  pruneStore(now);

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

function getClientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// ─── Supabase helper (lazy + dynamic import para Edge safety) ──
async function getSupabaseUser(request, supabaseResponse) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rhfsxncgklklcojqtpfp.supabase.co";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoZnN4bmNna2xrbGNvanF0cGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNTcyNTksImV4cCI6MjA5ODkzMzI1OX0.jj54H55bQPld091nzIKYBtarrXEsPYjVsUzhU6W-QLY";

    if (!url || !key) return { user: null, response: supabaseResponse };

    // Dynamic import para garantir que só carrega se realmente precisar
    const { createServerClient } = await import("@supabase/ssr");

    let finalResponse = supabaseResponse;

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          finalResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            finalResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    return { user, response: finalResponse };
  } catch (err) {
    console.error("[Middleware] Supabase getUser failed:", err.message);
    return { user: null, response: supabaseResponse };
  }
}

// ─── Main Middleware ────────────────────────────────────────
export async function middleware(request) {
  try {
    const ip = getClientIp(request);
    const pathname = request.nextUrl.pathname;

    // 1. Rate limiting
    let rateType = "general";
    if (pathname.startsWith("/api/")) rateType = "api";
    if (pathname.includes("/login") || pathname.includes("/registar") || pathname.includes("/auth/")) {
      rateType = "auth";
    }

    const rateResult = checkRateLimit(ip, rateType);
    if (!rateResult.allowed) {
      const minutes = Math.ceil((rateResult.resetIn || 60000) / 60000);
      return new NextResponse(
        JSON.stringify({ error: `Demasiados pedidos. Tenta novamente em ${minutes} minutos.` }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((rateResult.resetIn || 60000) / 1000)),
          },
        }
      );
    }

    // 2. Bloquear métodos perigosos
    if (["TRACE", "TRACK", "DEBUG"].includes(request.method)) {
      return new NextResponse(
        JSON.stringify({ error: "Método não permitido." }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Resposta base
    let response = NextResponse.next({ request });

    // 4. Proteção de rotas autenticadas (requer Supabase)
    const protectedPaths = ["/ferramentas", "/chat"];
    const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

    if (isProtected) {
      const { user, response: updatedResponse } = await getSupabaseUser(request, response);
      response = updatedResponse;

      if (!user) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
    } else {
      // Rotas públicas: não chamar getSupabaseUser().
      // A sessão Supabase é refrescada nos Server Components via createClient().
      // Chamar getUser() aqui adicionaria latência de rede desnecessária em cada request.
    }

    // 5. Bloquear logout via GET
    if (pathname === "/auth/logout" && request.method === "GET") {
      return new NextResponse(
        JSON.stringify({ error: "Logout requer método POST." }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    // 6. CSRF check para POSTs de API
    if (request.method === "POST" && pathname.startsWith("/api/") && !pathname.startsWith("/api/webhooks/")) {
      const origin = request.headers.get("origin");
      const referer = request.headers.get("referer");
      const allowedHost = new URL(request.url).host;

      const isValidOrigin = origin && new URL(origin).host === allowedHost;
      const isValidReferer = referer && new URL(referer).host === allowedHost;

      if (!isValidOrigin && !isValidReferer) {
        return new NextResponse(
          JSON.stringify({ error: "Origem inválida." }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 7. Headers de segurança
    try {
      response.headers.set("X-Request-ID", crypto.randomUUID());
    } catch {
      response.headers.set("X-Request-ID", Date.now().toString(36));
    }

    return response;
  } catch (error) {
    // NUNCA deixar o middleware crashar — passar adiante
    console.error("[Middleware] FATAL:", error.message);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)",
  ],
};
