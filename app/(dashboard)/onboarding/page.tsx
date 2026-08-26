import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import OnboardingClient from './OnboardingClient';
import { BLOCOS_QUEM_SOU_EU } from '@/lib/prompts';
import type { Profile } from '@/lib/types';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [{ data: profile }, { data: quemSouEu }, { data: via }, { data: pdi }, { data: diario }, { data: secoesPdiTotal }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single<Profile>(),
      supabase.from('quem_sou_eu_respostas').select('id').eq('user_id', user.id),
      supabase.from('via_resultados').select('id').eq('user_id', user.id),
      supabase.from('pdi_respostas').select('id').eq('user_id', user.id).eq('concluido', true),
      supabase.from('journal_notes').select('id').eq('user_id', user.id),
      supabase.from('pdi_guia_secoes').select('id'),
    ]);

  return (
    <OnboardingClient
      profile={profile}
      progresso={{
        onboardingFeito: !!profile?.onboarding_concluido,
        blocosQuemSouEu: quemSouEu?.length ?? 0,
        totalBlocosQuemSouEu: BLOCOS_QUEM_SOU_EU.length,
        fezVia: (via?.length ?? 0) > 0,
        secoesPdi: pdi?.length ?? 0,
        totalSecoesPdi: secoesPdiTotal?.length ?? 20,
        anotacoesDiario: diario?.length ?? 0,
      }}
    />
  );
}
