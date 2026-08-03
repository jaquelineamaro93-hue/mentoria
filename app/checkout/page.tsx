import { createClient } from '@/lib/supabase/server';
import CheckoutClient from './CheckoutClient';
import type { PlanoMentoria } from '@/lib/types';

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Se já está autenticado, redireciona pra dashboard
  if (user) {
    const { redirect } = await import('next/navigation');
    redirect('/dashboard');
  }

  const { data: planos } = await supabase
    .from('planos_mentoria')
    .select('*')
    .eq('ativo', true)
    .order('duracao_meses', { ascending: true });

  return <CheckoutClient planos={planos || []} />;
}
