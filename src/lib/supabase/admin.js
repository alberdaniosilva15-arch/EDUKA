/**
 * Eduka — Supabase Admin Client (Service Role)
 * ⚠️ APENAS para uso server-side! Nunca expor no browser.
 * Tem acesso total à base de dados, ignora RLS.
 */
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let adminClient = null;

export function createAdminClient() {
  if (adminClient) return adminClient;

  adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return adminClient;
}
