import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import VotarEncontroClient from './VotarEncontroClient';
import type { Profile } from '@/lib/types';

export default async function VotarEncontroPage() {
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

  return (
    <VotarEncontroClient profile={profile} />
  );
}
