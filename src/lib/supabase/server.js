/**
 * Eduka — Supabase Server Client
 * Usa este cliente em Server Components, API Routes e Server Actions
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // O setAll é chamado de Server Components onde não se pode
            // definir cookies. Pode ser ignorado se o middleware
            // tratar o refresh da sessão.
          }
        },
      },
    }
  );
}
