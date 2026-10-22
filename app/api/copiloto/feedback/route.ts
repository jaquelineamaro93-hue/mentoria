import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { consumeIdentifierRateLimit } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

const INTENCOES = ['progresso', 'vaga', 'pdi', 'orientacao'] as const;
const AVALIACOES = ['positivo', 'negativo'] as const;
const responder = (conteudo: object, status = 200) =>
  NextResponse.json(conteudo, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: NextRequest) {
  // Não aceitar envio cross-site; não receber texto da conversa ou currículo.
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return responder({ erro: 'Origem não permitida.' }, 403);
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid');
  } catch {
    return responder({ erro: 'Feedback inválido.' }, 400);
  }
  const responseId = typeof body.responseId === 'string' ? body.responseId : '';
  const rating = typeof body.rating === 'string' ? body.rating : '';
  const intent = typeof body.intent === 'string' ? body.intent : '';
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(responseId)
    || !AVALIACOES.includes(rating as typeof AVALIACOES[number])
    || !INTENCOES.includes(intent as typeof INTENCOES[number])
    || reason.length > 350) {
    return responder({ erro: 'Informações de avaliação inválidas.' }, 400);
  }
  const db = await createClient();
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user) return responder({ erro: 'Entre na SOMA para avaliar a Íris.' }, 401);

  // O feedback não exige acesso a outros usuários e usa RLS por auth.uid().
  const { data: perfil, error: perfilError } = await db.from('profiles')
    .select('is_admin,status_assinatura,trial_status,trial_ends_at,data_fim_acesso')
    .eq('id', user.id).maybeSingle();
  if (perfilError || !perfil) return responder({ erro: 'Seu perfil não está disponível.' }, 403);
  const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const ativo = perfil.status_assinatura === 'ativo'
    && (!perfil.data_fim_acesso || perfil.data_fim_acesso >= hoje);
  const trial = perfil.trial_status === 'active' && !!perfil.trial_ends_at
    && Date.parse(perfil.trial_ends_at) > Date.now();
  if (!perfil.is_admin && !ativo && !trial) return responder({ erro: 'Seu acesso está inativo.' }, 403);

  const permitido = await consumeIdentifierRateLimit({
    scope: 'iris_feedback', identifier: user.id, limit: 35, windowSeconds: 3600,
  });
  if (!permitido) return responder({ erro: 'Muitas avaliações enviadas. Tente mais tarde.' }, 429);

  const { error } = await db.from('soma_copilot_feedback').upsert({
    user_id: user.id,
    response_id: responseId,
    intent,
    rating,
    reason,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,response_id' });
  if (error) {
    console.error('[Íris feedback] falha ao registrar feedback', error.code);
    return responder({ erro: 'Não foi possível guardar sua avaliação.' }, 503);
  }
  return responder({ ok: true });
}
