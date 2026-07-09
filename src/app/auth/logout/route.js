/**
 * Eduka — Logout API Route
 * Apenas POST para prevenir CSRF via GET (ex: <img src="/auth/logout">)
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/", request.url), {
    status: 302,
  });
}

// GET não é permitido — prevenir CSRF
export async function GET() {
  return NextResponse.json(
    { error: "Logout requer método POST." },
    { status: 405 }
  );
}
