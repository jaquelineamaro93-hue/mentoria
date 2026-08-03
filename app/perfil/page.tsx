import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PerfilClient from './PerfilClient';

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: perfil } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: plano } = perfil?.plano_id
    ? await supabase
        .from('planos_mentoria')
        .select('*')
        .eq('id', perfil.plano_id)
        .single()
    : { data: null };

  return <PerfilClient perfil={perfil} plano={plano} />;
}
