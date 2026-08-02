import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MinhaTrilhaClient from './MinhaTrilhaClient';
import type { CheckinMensal, PlanoMentoria, Profile } from '@/lib/types';

export default async function MinhaTrilhaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>();

  const { data: plano } = profile?.plano_id
    ? await supabase
        .from('planos_mentoria')
        .select('*')
        .eq('id', profile.plano_id)
        .single<PlanoMentoria>()
    : { data: null };

  const { data: checkins } = await supabase
    .from('checkins_mensais')
    .select('*')
    .eq('user_id', user.id)
    .order('mes_referencia', { ascending: true })
    .returns<CheckinMensal[]>();

  return (
    <MinhaTrilhaClient
      profile={profile}
      duracaoMeses={plano?.duracao_meses ?? 6}
      dataInicio={profile?.created_at ?? new Date().toISOString()}
      checkinsIniciais={checkins ?? []}
    />
  );
}
