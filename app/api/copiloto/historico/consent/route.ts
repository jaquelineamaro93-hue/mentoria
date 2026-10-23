import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { consumeIdentifierRateLimit } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const json = (value: object, status = 200) =>
  NextResponse.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });

// Registrar o aceite somente mediante gesto explícito do usuário.
// O servidor não recebe nem altera o conteúdo das conversas nesta rota.
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin)
    return json({ erro: 'Origem inválida.' }, 403);

  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) return json({ erro: 'Faça login para configurar o histórico.' }, 401);

  const permitido = await consumeIdentifierRateLimit({
    scope: 'iris_privacy_preference', identifier: user.id, limit: 15, windowSeconds: 3600,
  });
  if (!permitido) return json({ erro: 'Muitas alterações de privacidade. Tente mais tarde.' }, 429);

  let body: unknown;
  try { body = await request.json(); } catch {
    return json({ erro: 'Pedido inválido.' }, 400);
  }
  if (!body || typeof body !== 'object' || !('habilitar' in body) ||
      typeof body.habilitar !== 'boolean') {
    return json({ erro: 'Escolha de privacidade inválida.' }, 400);
  }
  const habilitar = body.habilitar;
  const admin = createAdminClient();
  const { data: anterior, error: erroAnterior } = await admin
    .from('iris_web_privacy_preferences').select('user_id,history_enabled')
    .eq('user_id', user.id).maybeSingle();
  if (erroAnterior) return json({ erro: 'Não foi possível consultar sua preferência.' }, 503);

  if (!habilitar && !anterior) {
    // Quem nunca consentiu já está no modo de conversa sem armazenamento.
    return json({ historico_aceito: false, historico_ativo: false });
  }

  const agora = new Date().toISOString();
  let erroSalvar: unknown = null;
  if (anterior) {
    const result = await admin.from('iris_web_privacy_preferences')
      .update({ history_enabled: habilitar, updated_at: agora })
      .eq('user_id', user.id);
    erroSalvar = result.error;
  } else {
    const result = await admin.from('iris_web_privacy_preferences').insert({
      user_id: user.id,
      consent_version: 'iris_web_v1',
      accepted_at: agora,
      updated_at: agora,
      history_enabled: true,
    });
    erroSalvar = result.error;
  }
  if (erroSalvar) return json({ erro: 'Não foi possível salvar a preferência de privacidade.' }, 503);
  return json({ historico_aceito: true, historico_ativo: habilitar });
}
