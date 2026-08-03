import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CheckoutClient from './CheckoutClient';
import type { PlanoMentoria } from '@/lib/types';

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Se já está autenticado e ativo, redireciona pra dashboard
  if (user) {
    const { data: perfil } = await supabase
      .from('profiles')
      .select('plano_id, status_assinatura')
      .eq('id', user.id)
      .single();

    // Se tem plano e tá ativo, não deixa recomprar
    if (perfil?.plano_id && perfil?.status_assinatura === 'ativo') {
      redirect('/dashboard');
    }
  }

  const { data: planos } = await supabase
    .from('planos_mentoria')
    .select('*')
    .eq('ativo', true)
    .order('duracao_meses', { ascending: true });

  return <CheckoutClient planos={planos || []} />;
}
