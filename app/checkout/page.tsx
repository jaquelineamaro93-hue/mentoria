import { createClient } from '@/lib/supabase/server';
import CheckoutClient from './CheckoutClient';
import type { PlanoMentoria } from '@/lib/types';

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let planoAtualCodigo: string | null = null;
  if (user) {
    const { data: perfil } = await supabase
      .from('profiles')
      .select('plano_id')
      .eq('id', user.id)
      .single();
    if (perfil?.plano_id) {
      const { data: planoAtual } = await supabase
        .from('planos_mentoria')
        .select('codigo')
        .eq('id', perfil.plano_id)
        .single();
      planoAtualCodigo = planoAtual?.codigo ?? null;
    }
  }

  const { data: planos } = await supabase
    .from('planos_mentoria')
    .select('*')
    .eq('ativo', true)
    .eq('visivel_checkout', true)
    .order('duracao_meses', { ascending: true });

  return <CheckoutClient planos={planos || []} logado={!!user} planoAtualCodigo={planoAtualCodigo} />;
}
