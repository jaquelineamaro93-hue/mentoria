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
    .order('ordem')
    .returns<PlanoMentoria[]>();

  return <RenovarClient profile={profile} planos={planos ?? []} />;
}
