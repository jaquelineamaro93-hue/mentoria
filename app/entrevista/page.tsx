import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import EntrevistaClient from './EntrevistaClient';
import type { Profile } from '@/lib/types';

export default async function EntrevistaPage() {
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
      .select('nome, tipo_pacote, is_admin')
      .eq('id', user.id)
      .single();
    profile = data;
  } catch (error) {
    console.error('Erro ao carregar profile:', error);
  }

  return <EntrevistaClient userId={user.id} profile={profile} />;
}
