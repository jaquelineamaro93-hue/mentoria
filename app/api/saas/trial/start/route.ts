import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { consumeSecurityRateLimit } from '@/lib/security/rate-limit';
import { modulosPermitidosNoPlano, resolverAcessoSaas, SAAS_TRIAL_DIAS } from '@/lib/soma-saas-entitlements';
import type { PlanoSaasCodigo } from '@/lib/soma-saas-entitlements';

export const runtime = 'nodejs';
const json = (v: object, status=200) => NextResponse.json(v, {
  status, headers: { 'Cache-Control': 'private, no-store' },
});

export async function POST(request: NextRequest) {
  // Fail closed enquanto RLS, rotas e limites de agentes não forem homologados.
  // O controle é exclusivo do servidor, não enviado pelo navegador.
  if (process.env.SOMA_SAAS_TRIAL_GATES_READY !== 'true') {
    return json({ error: 'O teste gratuito da Plataforma ainda não está disponível.' }, 503);
  }
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return json({ error: 'Faça login para iniciar seu teste.' }, 401);
  if (!await consumeSecurityRateLimit({ request, scope: 'saas_trial_start',
    identifier: user.id, limit: 5, windowSeconds: 3600 })) {
    return json({ error: 'Muitas tentativas. Tente novamente mais tarde.' }, 429);
  }
  let body: unknown;
  try { body = await request.json(); } catch { return json({ error: 'Pedido inválido.' }, 400); }
  if (!body || typeof body !== 'object') return json({ error: 'Pedido inválido.' }, 400);
  const { plano, modulo } = body as { plano?: unknown; modulo?: unknown };
  if (plano !== 'avulso' && plano !== 'essencial' && plano !== 'pro') {
    return json({ error: 'Escolha um plano da plataforma.' }, 400);
  }
  const moduleSlug = plano === 'avulso' && typeof modulo === 'string' ? modulo : null;
  if (!modulosPermitidosNoPlano(plano, moduleSlug).length ||
      (plano !== 'avulso' && modulo != null)) {
    return json({ error: 'Módulo inválido para esse plano.' }, 400);
  }
  const acesso = await resolverAcessoSaas(user.id);
  if (acesso.temMentoria || acesso.trialJaUsado) {
    return json({ error: 'Esta conta já tem acesso ou utilizou um teste gratuito.' }, 409);
  }
  // Não misturar trial com plano pago anterior ou presente.
  const admin = createAdminClient();
  const { count, error: subsError } = await admin.from('soma_module_orders')
    .select('id', { count: 'exact', head: true }).eq('user_id', user.id);
  if (subsError || count == null) return json({ error: 'Não foi possível confirmar a elegibilidade.' }, 503);
  if (count > 0) return json({ error: 'O teste gratuito não está disponível para esta conta.' }, 409);

  const start = new Date();
  const end = new Date(start.getTime() + SAAS_TRIAL_DIAS * 24 * 60 * 60 * 1000);
  const { error } = await admin.from('soma_saas_trials').insert({
    user_id: user.id, plan_code: plano as PlanoSaasCodigo, module_slug: moduleSlug,
    started_at: start.toISOString(), ends_at: end.toISOString(),
  });
  // A PK única impede iniciar novamente usando chamadas simultâneas.
  if (error?.code === '23505') return json({ error: 'O teste gratuito já foi utilizado.' }, 409);
  if (error) return json({ error: 'Não foi possível iniciar o teste gratuito.' }, 503);
  return json({ iniciado: true, dias: SAAS_TRIAL_DIAS,
    plano, expira_em: end.toISOString() });
}
