import { NextResponse } from "next/server";
import { authenticateAndRateLimit } from "@/lib/api-helpers";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/chat/conversations/[id] — Busca mensagens de uma conversa
 * DELETE /api/chat/conversations/[id] — Apaga uma conversa
 */
export async function GET(request, { params }) {
  try {
    const { user, error: authError } = await authenticateAndRateLimit(request);
    if (authError) return authError;

    const { id } = await params;
    const supabase = await createClient();

    // Verificar que a conversa pertence ao utilizador
    const { data: convo, error: convoError } = await supabase
      .from("chat_conversations")
      .select("id, title, model, created_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (convoError || !convo) {
      return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
    }

    // Buscar mensagens
    const { data: messages, error: msgError } = await supabase
      .from("chat_messages")
      .select("id, role, content, model, provider, latency_ms, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (msgError) {
      console.error("[Chat Messages] List error:", msgError.message);
      return NextResponse.json({ conversation: convo, messages: [] });
    }

    return NextResponse.json({ conversation: convo, messages: messages || [] });
  } catch (error) {
    console.error("[Chat Messages] Erro:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user, error: authError } = await authenticateAndRateLimit(request);
    if (authError) return authError;

    const { id } = await params;
    const supabase = await createClient();

    // Apagar conversa (ascade delete apaga mensagens via FK)
    const { error } = await supabase
      .from("chat_conversations")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[Chat Messages] Delete error:", error.message);
      return NextResponse.json({ error: "Erro ao apagar conversa." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Chat Messages] Erro:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
