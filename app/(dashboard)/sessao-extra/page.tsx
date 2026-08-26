import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SessaoExtraClient from './SessaoExtraClient';

export default async function SessaoExtraPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Se não tá logado, redireciona pro login
  if (!user) redirect('/login');

  const { data: perfil } = await supabase
    .from('profiles')
    .select('id, nome, plano_id, tipo_pacote')
    .eq('id', user.id)
    .single();

  // Se não tá ativo ou sem plano, não pode comprar sessão extra
  if (!perfil || !perfil.plano_id) {
    redirect('/dashboard');
  }

  return <SessaoExtraClient perfil={perfil} />;
}
