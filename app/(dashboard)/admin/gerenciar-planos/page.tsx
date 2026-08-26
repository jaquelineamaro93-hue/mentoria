import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import GerenciarPlanosClient from './GerenciarPlanosClient';

export default async function GerenciarPlanosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: perfilAdmin } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!perfilAdmin?.is_admin) redirect('/dashboard');

  const { data: mentorados } = await supabase
    .from('profiles')
    .select('*')
    .order('nome', { ascending: true });

  const { data: planos } = await supabase
    .from('planos_mentoria')
    .select('*')
    .eq('ativo', true)
    .order('duracao_meses', { ascending: true });

  return (
    <GerenciarPlanosClient
      mentorados={mentorados || []}
      planos={planos || []}
    />
  );
}
