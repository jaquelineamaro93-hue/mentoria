import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PdiClient from './PdiClient';
import type { PdiGuiaSecao, PdiResposta, Profile } from '@/lib/types';

export default async function PdiPage() {
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

  const { data: secoes } = await supabase
    .from('pdi_guia_secoes')
    .select('*')
    .order('ordem', { ascending: true })
    .returns<PdiGuiaSecao[]>();

  const { data: respostas } = await supabase
    .from('pdi_respostas')
    .select('*')
    .eq('user_id', user.id)
    .returns<PdiResposta[]>();

  return (
    <PdiClient
      profile={profile}
      userId={user.id}
      secoes={secoes ?? []}
      respostasIniciais={respostas ?? []}
    />
  );
}
