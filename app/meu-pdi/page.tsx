import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MeuPdiClient from './MeuPdiClient';
import type { Profile } from '@/lib/types';

export default async function MeuPdiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: pdiRespostas } = await supabase
    .from('pdi_respostas')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  let documentos = [];
  try {
    const { data } = await supabase
      .from('documentos_mentorado')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    documentos = data || [];
  } catch (error) {
    documentos = [];
  }

  return (
    <MeuPdiClient
      profile={profile as Profile | null}
      userId={user.id}
      pdiRespostas={pdiRespostas || []}
      documentosIniciais={documentos || []}
    />
  );
}
