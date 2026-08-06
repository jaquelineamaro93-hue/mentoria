import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CrescimentoClient from './CrescimentoClient';

export default async function CrescimentoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: perfilAdmin } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!perfilAdmin?.is_admin) redirect('/dashboard');

  const { data: mentorados } = await supabase
    .from('profiles')
    .select('id, nome, indicado_por_id, codigo_indicacao, sessoes_bonus_resgatadas, onboarding_concluido, last_login_at')
    .eq('is_admin', false);

  const total = mentorados?.length ?? 0;
  const viaIndicacao = mentorados?.filter((m) => m.indicado_por_id).length ?? 0;
  const jaIndicaramAlguem = new Set(
    (mentorados ?? []).filter((m) => m.indicado_por_id).map((m) => m.indicado_por_id)
  ).size;
  const nuncaAcessaram = mentorados?.filter((m) => !m.last_login_at).length ?? 0;
  const onboardingPendente = mentorados?.filter((m) => !m.onboarding_concluido).length ?? 0;

  return (
    <CrescimentoClient
      profile={perfilAdmin}
      insights={{
        total,
        viaIndicacao,
        jaIndicaramAlguem,
        nuncaAcessaram,
        onboardingPendente,
      }}
    />
  );
}
