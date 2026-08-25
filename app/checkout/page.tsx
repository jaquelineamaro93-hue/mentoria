import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import CheckoutClient from './CheckoutClient';
import type { PlanoMentoria } from '@/lib/types';

export default async function CheckoutPage() {
  const supabase = await createClient();

  const { data: planosRaw } = await supabase
    .from('planos_mentoria')
    .select('*')
    .eq('ativo', true)
    .eq('visivel_checkout', true)
    .order('duracao_meses', { ascending: true })
    .order('ordem', { ascending: true });

  const planos = (planosRaw || []).filter((p) => p.codigo && !p.codigo.toLowerCase().includes('teste'));

  const { data: { user } } = await supabase.auth.getUser();

  let planoAtualCodigo: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('tipo_pacote')
      .eq('id', user.id)
      .single();

    if (profile?.tipo_pacote) {
      planoAtualCodigo = profile.tipo_pacote;
    }
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <Link href="/planos" className="inline-flex items-center gap-2 text-black hover:text-gray-text mb-8">
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </Link>

        <h1 className="text-4xl font-display text-black mb-12 text-center">Checkout</h1>

        {planoAtualCodigo && (
          <div className="bg-mint-light border border-mint rounded-xl p-4 mb-8 text-center text-sm text-black">
            Você já possui um plano ativo. Ao escolher um novo plano, ele substituirá o anterior ao ser confirmado.
          </div>
        )}

        <CheckoutClient planos={planos || []} logado={!!user} planoAtualCodigo={planoAtualCodigo} />
      </div>
    </div>
  );
}
