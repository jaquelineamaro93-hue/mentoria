import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import IndiqueUmAmigoClient from './IndiqueUmAmigoClient';
import type { Indicacao, Profile } from '@/lib/types';

export default async function IndiqueUmAmigoPage() {
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

  const { data: indicacoes } = await supabase
    .from('indicacoes')
    .select('*')
    .eq('indicador_id', user.id)
    .order('created_at', { ascending: false })
    .returns<Indicacao[]>();

  return (
    <IndiqueUmAmigoClient
      profile={profile}
      indicacoesIniciais={indicacoes ?? []}
    />
  );
}
