import 'server-only';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const validConversationId = (id: unknown): id is string =>
  typeof id === 'string' && UUID.test(id);

function cleanText(text: string, length: number) {
  return text.trim().slice(0, length);
}

export async function ownsIrisConversation(userId: string, conversationId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('iris_web_conversations')
    .select('id').eq('id', conversationId).eq('user_id', userId).maybeSingle();
  if (error) throw new Error('Não foi possível validar sua conversa.');
  return !!data;
}

/** Contexto curto apenas da conversa do próprio usuário, nunca do WhatsApp. */
export async function recentIrisContext(userId: string, conversationId: string | null) {
  if (!conversationId) return '';
  const admin = createAdminClient();
  const { data, error } = await admin.from('iris_web_messages')
    .select('role,content')
    .eq('user_id', userId).eq('conversation_id', conversationId)
    .order('created_at', { ascending: false }).limit(12);
  if (error) return '';
  return (data ?? []).reverse().map(m =>
    (m.role === 'user' ? 'Mentorado: ' : 'Íris: ') + cleanText(m.content, 350)
  ).join('\n').slice(0, 3400);
}

export async function saveIrisTurn(args: {
  userId: string; conversationId: string | null;
  question: string; answer: string; href?: string;
}) {
  const admin = createAdminClient();
  let conversationId = args.conversationId;
  if (conversationId && !(await ownsIrisConversation(args.userId, conversationId))) {
    throw new Error('Conversa não pertence à conta.');
  }
  let createdHere = false;
  if (!conversationId) {
    const title = cleanText(args.question.replace(/\s+/g, ' '), 95) || 'Nova conversa';
    const { data, error } = await admin.from('iris_web_conversations')
      .insert({ user_id: args.userId, title }).select('id').single();
    if (error || !data) throw new Error('Não foi possível iniciar o histórico.');
    conversationId = data.id;
    createdHere = true;
  }
  const responseRef = crypto.randomUUID();
  const insert = [
    {
      user_id: args.userId, conversation_id: conversationId,
      role: 'user', content: cleanText(args.question, 4000),
    },
    {
      user_id: args.userId, conversation_id: conversationId,
      role: 'assistant', content: cleanText(args.answer, 5000),
      response_ref: responseRef, href: args.href?.startsWith('/') ? args.href.slice(0, 180) : null,
    },
  ];
  const { error } = await admin.from('iris_web_messages').insert(insert);
  if (error) {
    if (createdHere) await admin.from('iris_web_conversations').delete()
      .eq('id', conversationId).eq('user_id', args.userId);
    throw new Error('Não foi possível salvar a conversa.');
  }
  const { error: updateError } = await admin.from('iris_web_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId).eq('user_id', args.userId);
  if (updateError) console.warn('[Íris histórico] última atividade não atualizada', updateError.code);
  return { conversation_id: conversationId, resposta_ref: responseRef };
}
