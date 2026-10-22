import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { consumeIdentifierRateLimit } from '@/lib/security/rate-limit';
import { validarComprovanteFeedback } from '@/lib/iris-feedback-token';

export const runtime = 'nodejs';
export const maxDuration = 15;

const json = (body: object, status = 200) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return json({ erro: 'Origem não autorizada.' }, 403);
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ erro: 'Entre na SOMA para avaliar uma resposta.' }, 401);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw Error('inválido');
  } catch {
    return json({ erro: 'Feedback inválido.' }, 400);
  }

  const rating = body.rating;
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  const token = typeof body.feedbackToken === 'string' ? body.feedbackToken.trim() : '';
  if (rating !== 'positivo' && rating !== 'negativo') return json({ erro: 'Avaliação inválida.' }, 400);
  if (rating === 'negativo' && (reason.length < 8 || reason.length > 800)) {
    return json({ erro: 'Conte em pelo menos 8 caracteres o que faltou na resposta (máximo 800).' }, 400);
  }
  if (rating === 'positivo' && reason) return json({ erro: 'O comentário é usado somente no não gostei.' }, 400);
  if (token.length > 190) return json({ erro: 'Comprovante inválido.' }, 400);

  // O token é assinado ao produzir a resposta. Confere ID do usuário no
  // servidor, evitando feedback para respostas inventadas ou de outras contas.
  const resposta = validarComprovanteFeedback(user.id, token);
  if (!resposta) return json({ erro: 'Esta resposta não pode mais ser avaliada. Peça uma nova resposta à Íris.' }, 400);

  const allowed = await consumeIdentifierRateLimit({
    scope: 'iris_copilot_feedback',
    identifier: user.id,
    limit: 80,
    windowSeconds: 24 * 60 * 60,
  });
  if (!allowed) return json({ erro: 'Limite de avaliações atingido. Tente mais tarde.' }, 429);

  // Salva apenas o ID anônimo da resposta, intenção e feedback voluntário.
  // Nunca CV, histórico completo, prompt nem outras informações do mentorado.
  const { error } = await supabase.from('soma_copilot_feedback').upsert({
    user_id: user.id,
    response_id: resposta.responseId,
    intent: resposta.intent,
    rating,
    reason: rating === 'negativo' ? reason : '',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,response_id' });
  if (error) {
    console.error('[Iris feedback] falha ao salvar', error.code);
    return json({ erro: 'Não consegui salvar sua avaliação agora. Tente novamente.' }, 503);
  }
  return json({ salvo: true });
}
