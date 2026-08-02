import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import GravacoesClient from './GravacoesClient';
import type { Profile, Recording } from '@/lib/types';

export default async function GravacoesPage() {
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

  const { data: gravacoes } = await supabase
    .from('recordings')
    .select('*')
    .order('data_encontro', { ascending: false })
    .returns<Recording[]>();

  return <GravacoesClient profile={profile} gravacoes={gravacoes ?? []} />;
}
