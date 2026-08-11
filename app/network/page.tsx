import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NetworkClient from './NetworkClient';
import type { Profile } from '@/lib/types';

export default async function NetworkPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let profile: Profile | null = null;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data as Profile;
  } catch (error) {
    console.error('Erro ao carregar profile:', error);
  }

  return <NetworkClient userId={user.id} profile={profile} />;
}
