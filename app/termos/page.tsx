import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TermosClient from './TermosClient';
import type { Profile, TermoVersao } from '@/lib/types';

export default async function TermosPage() {
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

  const { data: termo } = await supabase
    .from('termos_versoes')
    .select('*')
    .eq('ativo', true)
    .order('publicado_em', { ascending: false })
    .limit(1)
    .single<TermoVersao>();

  const { data: aceite } = await supabase
    .from('termos_aceites')
    .select('aceito_em')
    .eq('user_id', user.id)
    .eq('termo_id', termo?.id ?? '')
    .maybeSingle();

  return (
    <TermosClient
      profile={profile}
      termo={termo ?? null}
      aceitoEm={aceite?.aceito_em ?? null}
    />
  );
}
