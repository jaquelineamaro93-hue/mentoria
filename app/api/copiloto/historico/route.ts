import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validConversationId } from '@/lib/iris-web-history';
import { consumeIdentifierRateLimit } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const json = (body: object, status = 200) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });

export async function GET(request: NextRequest) {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) return json({ erro: 'Entre na SOMA para consultar seu histórico.' }, 401);
  const permitido = await consumeIdentifierRateLimit({
    scope: 'iris_history_list', identifier: user.id, limit: 90, windowSeconds: 3600,
  });
  if (!permitido) return json({ erro: 'Muitas consultas ao histórico.' }, 429);
  const conversationId = request.nextUrl.searchParams.get('conversation_id');
  if (conversationId && !validConversationId(conversationId)) {
    return json({ erro: 'Conversa inválida.' }, 400);
  }
  const { data: threads, error: threadsError } = await db.from('iris_web_conversations')
    .select('id,title,updated_at,created_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false }).limit(50);
  if (threadsError) return json({ erro: 'Não foi possível carregar suas conversas.' }, 503);
  const selected = conversationId || threads?.[0]?.id;
  if (!selected) return json({ conversas: [], mensagens: [], conversation_id: null });
  const { data: thread, error: selectedError } = await db.from('iris_web_conversations')
    .select('id').eq('user_id', user.id).eq('id', selected).maybeSingle();
  if (selectedError) return json({ erro: 'Não foi possível validar a conversa.' }, 503);
  if (!thread) return json({ erro: 'Conversa não encontrada.' }, 404);
  // Últimas 150 mensagens e ordem cronológica. Limite deliberado para carregamento.
  const { data: recent, error: messagesError } = await db.from('iris_web_messages')
    .select('id,role,content,href,response_ref,feedback_rating,created_at')
    .eq('user_id', user.id).eq('conversation_id', selected)
    .order('created_at', { ascending: false }).limit(150);
  if (messagesError) return json({ erro: 'Não foi possível carregar as mensagens.' }, 503);
  return json({ conversas: threads ?? [], mensagens: (recent ?? []).reverse(), conversation_id: selected,
    limite_atingido: (recent ?? []).length === 150 });
}

export async function DELETE(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return json({ erro: 'Origem inválida.' }, 403);
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) return json({ erro: 'Não autenticado.' }, 401);
  let data: Record<string, unknown>;
  try { data = await request.json() as Record<string, unknown>; }
  catch { return json({ erro: 'Solicitação inválida.' }, 400); }
  if (!validConversationId(data?.conversation_id)) return json({ erro: 'Conversa inválida.' }, 400);
  const limite = await consumeIdentifierRateLimit({
    scope: 'iris_history_delete', identifier: user.id, limit: 10, windowSeconds: 3600,
  });
  if (!limite) return json({ erro: 'Limite de exclusões atingido.' }, 429);
  const admin = createAdminClient();
  const { data: conversa, error: verificationError } = await admin.from('iris_web_conversations')
    .select('id').eq('id', data.conversation_id).eq('user_id', user.id).maybeSingle();
  if (verificationError) return json({ erro: 'Falha ao verificar a conversa.' }, 503);
  if (!conversa) return json({ erro: 'Conversa não encontrada.' }, 404);
  const { error: deleteError } = await admin.from('iris_web_conversations').delete()
    .eq('id', conversa.id).eq('user_id', user.id);
  if (deleteError) return json({ erro: 'Não foi possível excluir a conversa.' }, 503);
  return json({ sucesso: true });
}
