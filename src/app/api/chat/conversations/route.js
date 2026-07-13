import { NextResponse } from "next/server";
import { authenticateAndRateLimit } from "@/lib/api-helpers";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/chat/conversations — Lista conversas do utilizador
 * POST /api/chat/conversations — Cria nova conversa
 */
export async function GET(request) {
  try {
    const { user, error: authError } = await authenticateAndRateLimit(request);
    if (authError) return authError;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("chat_conversations")
      .select("id, title, model, created_at, updated_at, message_count")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[Chat Convos] List error:", error.message);
      return NextResponse.json({ conversations: [] });
    }

    return NextResponse.json({ conversations: data || [] });
  } catch (error) {
    console.error("[Chat Convos] Erro:", error);
    return NextResponse.json({ conversations: [] });
  }
}

export async function POST(request) {
  try {
    const { user, error: authError } = await authenticateAndRateLimit(request);
    if (authError) return authError;

    const raw = await request.json();
    const title = (raw.title || "Nova conversa").slice(0, 200);
    const model = (raw.model || "llama-3.1-8b-instant").slice(0, 200);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({ user_id: user.id, title, model })
      .select("id, title, model, created_at")
      .single();

    if (error) {
      console.error("[Chat Convos] Create error:", error.message);
      return NextResponse.json({ error: "Erro ao criar conversa." }, { status: 500 });
    }

    return NextResponse.json({ conversation: data });
  } catch (error) {
    console.error("[Chat Convos] Erro:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
