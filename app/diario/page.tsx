import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DiarioClient from './DiarioClient';
import type { JournalNote, Profile } from '@/lib/types';

export default async function DiarioPage() {
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

  const { data: notes } = await supabase
    .from('journal_notes')
    .select('*')
    .eq('user_id', user.id)
    .order('encontro_data', { ascending: false })
    .returns<JournalNote[]>();

  return <DiarioClient profile={profile} notes={notes ?? []} userId={user.id} />;
}
