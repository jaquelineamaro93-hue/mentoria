import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import RenovarClient from './RenovarClient';
import type { PlanoMentoria, Profile } from '@/lib/types';

export default async function RenovarPage() {
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

  const { data: planos } = await supabase
    .from('planos_mentoria')
    .select('*')
    .eq('ativo', true)
    .eq('visivel_checkout', true)
    .gt('preco_avista', 1)
    .order('ordem')
    .returns<PlanoMentoria[]>();

  // Expiry is evaluated for this authenticated server request, not cached UI state.
  // eslint-disable-next-line react-hooks/purity
  const trialExpirado = profile?.status_assinatura !== 'ativo' && (profile?.trial_status === 'expired' || (profile?.trial_status === 'active' && !!profile.trial_ends_at && new Date(profile.trial_ends_at).getTime() <= Date.now()));
  return <RenovarClient profile={profile} planos={planos ?? []} trialExpirado={trialExpirado} />;
}
