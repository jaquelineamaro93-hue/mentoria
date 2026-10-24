import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

export const SAAS_TRIAL_DIAS = 7;
export type PlanoSaasCodigo = 'avulso' | 'essencial' | 'pro';

export const MODULOS_ESSENCIAL = ['autoconhecimento', 'diagnostico', 'desenvolvimento'] as const;
export const MODULOS_PRO = [
  'autoconhecimento','diagnostico','desenvolvimento','curriculo-ats',
  'entrevistas','linkedin','networking','percepcao-360','vagas',
] as const;

export function modulosPermitidosNoPlano(
  plano: PlanoSaasCodigo, modulo: string | null,
): string[] {
  if (plano === 'avulso') return modulo && MODULOS_PRO.some(s => s === modulo)
    ? [modulo] : [];
  return plano === 'essencial' ? [...MODULOS_ESSENCIAL] : [...MODULOS_PRO];
}

export interface EstadoAcessoSaas {
  temMentoria: boolean;
  emTrialSaas: boolean;
  trialJaUsado: boolean;
  expiraEm: string | null;
  planoTrial: PlanoSaasCodigo | null;
  modulosPermitidos: string[];
}

/** Estritamente server-side. NUNCA usa o fallback permissivo de soma_has_module.
 * Não presume acesso a partir de rótulos informados pelo navegador.
 */
export async function resolverAcessoSaas(userId: string): Promise<EstadoAcessoSaas> {
  const admin = createAdminClient();
  const now = new Date();
  const [profile, trials, subs, grants] = await Promise.all([
    admin.from('profiles')
      .select('is_admin,plano_id,status_assinatura,data_fim_acesso,trial_status,trial_ends_at')
      .eq('id', userId).single(),
    admin.from('soma_saas_trials')
      .select('plan_code,module_slug,ends_at')
      .eq('user_id', userId).maybeSingle(),
    admin.from('soma_module_subscriptions')
      .select('module_slug,status,paid_through')
      .eq('user_id', userId),
    admin.from('soma_user_module_access')
      .select('module_slug,status,starts_at,expires_at')
      .eq('user_id', userId),
  ]);
  if (profile.error || !profile.data || trials.error || subs.error || grants.error) {
    throw new Error('Não foi possível conferir suas permissões.');
  }
  const p = profile.data;
  const fimAcesso = p.data_fim_acesso ? Date.parse(p.data_fim_acesso + 'T23:59:59-03:00') : Infinity;
  const mentoriaPaga = p.plano_id && p.status_assinatura === 'ativo' && fimAcesso >= now.getTime();
  const mentoriaTrial = p.trial_status === 'active' && !!p.trial_ends_at &&
    Date.parse(p.trial_ends_at) > now.getTime();
  const temMentoria = !!p.is_admin || !!mentoriaPaga || !!mentoriaTrial;
  const t = trials.data;
  const ativo = !!t?.ends_at && Date.parse(t.ends_at) > now.getTime();
  const trialModules = ativo
    ? modulosPermitidosNoPlano(t.plan_code as PlanoSaasCodigo, t.module_slug)
    : [];
  const pagos = (subs.data || []).filter(item =>
    item.status === 'ACTIVE' && !!item.paid_through &&
    Date.parse(item.paid_through) > now.getTime()
  ).map(item => item.module_slug);
  const concedidos = (grants.data || []).filter(item =>
    item.status === 'ACTIVE' &&
    Date.parse(item.starts_at) <= now.getTime() &&
    (!item.expires_at || Date.parse(item.expires_at) > now.getTime())
  ).map(item => item.module_slug);
  return {
    temMentoria,
    emTrialSaas: ativo,
    trialJaUsado: !!t,
    expiraEm: t?.ends_at || null,
    planoTrial: (t?.plan_code as PlanoSaasCodigo | undefined) ?? null,
    modulosPermitidos: temMentoria
      ? [...MODULOS_PRO]
      : [...new Set([...trialModules,...pagos,...concedidos])]
        .filter(item => MODULOS_PRO.some(m => m === item)),
  };
}
