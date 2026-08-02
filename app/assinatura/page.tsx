import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AssinaturaClient from './AssinaturaClient';
import type { Plano, Profile } from '@/lib/types';

export default async function AssinaturaPage() {
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
    .from('planos')
    .select('*')
    .eq('ativo', true)
    .order('valor_centavos', { ascending: true })
    .returns<Plano[]>();

  return <AssinaturaClient profile={profile} planos={planos ?? []} />;
}
