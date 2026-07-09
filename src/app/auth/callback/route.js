/**
 * Eduka — Auth Callback
 * Processa o redirect do Supabase Auth (confirmação de email, OAuth)
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "/ferramentas";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Validar redirect para prevenir Open Redirect
      const safeRedirect = redirect.startsWith('/') && !redirect.startsWith('//')
        ? redirect
        : '/ferramentas';
      return NextResponse.redirect(`${origin}${safeRedirect}`);
    }
  }

  // Se falhar, redirige para login com mensagem de erro
  return NextResponse.redirect(
    `${origin}/login?error=auth_callback_failed`
  );
}
