import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { consumeIdentifierRateLimit } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

function json(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const origem = request.headers.get('origin');
  if (origem && origem !== new URL(request.url).origin) {
    return json({ erro: 'Origem não permitida.' }, 403);
  }
  const db = await createClient();
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user) return json({ erro: 'Faça login para avaliar a Íris.' }, 401);

  // Não permitir votos de pessoas fora do período de acesso ao Copiloto.
  const { data: perfil, error: perfilErro } = await db.from('profiles')
    .select('is_admin,status_assinatura,data_fim_acesso,trial_status,trial_ends_at')
    .eq('id', user.id)
    .maybeSingle();
  if (perfilErro || !perfil) return json({ erro: 'Acesso não autorizado.' }, 403);
  const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const ativo = perfil.status_assinatura === 'ativo'
    && (!perfil.data_fim_acesso || perfil.data_fim_acesso >= hoje);
  const trial = perfil.trial_status === 'active'
    && !!perfil.trial_ends_at && Date.parse(perfil.trial_ends_at) > Date.now();
  if (!perfil.is_admin && !ativo && !trial) return json({ erro: 'Acesso inativo.' }, 403);

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
    if (!body || Array.isArray(body) || typeof body !== 'object') throw Error('invalid');
  } catch {
    return json({ erro: 'Avaliação inválida.' }, 400);
  }
  const avaliacao = body.avaliacao;
  const respostaRef = body.respostaRef;
  if ((avaliacao !== 'util' && avaliacao !== 'nao_util')
    || typeof respostaRef !== 'string'
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(respostaRef)) {
    return json({ erro: 'Informações de avaliação inválidas.' }, 400);
  }
  const comentario = typeof body.comentario === 'string'
    ? body.comentario.trim().slice(0, 300)
      .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[email]')
      .replace(/\+?\d[\d\s().-]{9,}\d/g, '[telefone]')
    : '';
  const permitido = await consumeIdentifierRateLimit({
    scope: 'iris_feedback', identifier: user.id, limit: 30, windowSeconds: 3600,
  });
  if (!permitido) return json({ erro: 'Limite de avaliações atingido. Tente mais tarde.' }, 429);

  // Guardar apenas a avaliação, referência efêmera e comentário opcional.
  // Nenhum CV, texto de conversa, prompt, dado de outro mentorado ou segredo de IA.
  const { error } = await db.from('product_events').insert({
    user_id: user.id,
    event_name: 'iris_response_feedback',
    feature_key: 'iris-copiloto',
    path: '/api/copiloto/feedback',
    metadata: { avaliacao, resposta_ref: respostaRef, ...(comentario ? { comentario } : {}) },
  });
  if (error) {
    console.error('[Iris Feedback] Falha ao registrar feedback', error.code);
    return json({ erro: 'Não foi possível registrar sua avaliação.' }, 503);
  }
  return json({ sucesso: true });
}
