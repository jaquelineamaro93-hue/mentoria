import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MeuPlanoClient from './MeuPlanoClient';
import type { Profile, PlanoMentoria } from '@/lib/types';

export default async function MeuPlanoPage() {
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

  return (
    <MeuPlanoClient
      profile={profile}
      plano={plano}
    />
  );
}
