import { createClient } from '@/lib/supabase/server';
import CheckoutClient from './CheckoutClient';
import type { PlanoMentoria } from '@/lib/types';

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  const supabase = await createClient();
  const planId = searchParams.plan;

  if (!planId) {
    return (
      <main className="min-h-screen bg-white py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-gray-text">Plano não especificado</p>
        </div>
      </main>
    );
  }

  const { data: plano } = await supabase
    .from('planos_mentoria')
    .select('*')
    .eq('id', planId)
    .eq('ativo', true)
    .single();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let planoAtualCodigo: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plano_id')
      .eq('id', user.id)
      .single();

    if (profile?.plano_id) {
      const { data: planoAtual } = await supabase
        .from('planos_mentoria')
        .select('codigo')
        .eq('id', profile.plano_id)
        .single();

      planoAtualCodigo = planoAtual?.codigo || null;
    }
  }

  return <CheckoutClient plano={plano as PlanoMentoria | null} logado={!!user} planoAtualCodigo={planoAtualCodigo} />;
}
