import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ExerciciosClient from './ExerciciosClient';
import type { Diagnostic, Profile } from '@/lib/types';

export default async function ExerciciosPage() {
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

  const { data: diagnostics } = await supabase
    .from('diagnostics')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .returns<Diagnostic[]>();

  return <ExerciciosClient profile={profile} diagnostics={diagnostics ?? []} userId={user.id} />;
}
