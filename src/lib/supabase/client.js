/**
 * Eduka — Supabase Browser Client
 * Usa este cliente em componentes "use client" (lado do browser)
 */
import { createBrowserClient } from "@supabase/ssr";

let supabaseClient = null;

export function createClient() {
  if (supabaseClient) return supabaseClient;

  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return supabaseClient;
}
