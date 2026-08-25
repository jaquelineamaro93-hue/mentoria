import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import MuralAtualizado from '@/components/MuralAtualizado';
import type { PlanoMentoria, Announcement } from '@/lib/types';

export default async function PlanosPage() {
  const supabase = await createClient();

  const { data: planosRaw } = await supabase
    .from('planos_mentoria')
    .select('*')
    .eq('ativo', true)
    .eq('visivel_checkout', true)
    .order('duracao_meses', { ascending: true })
    .order('ordem', { ascending: true });

  const planos = (planosRaw || []).filter((p) => p.codigo && !p.codigo.toLowerCase().includes('teste'));

  const { data: avisos } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-black hover:text-gray-text mb-8">
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </Link>

        <h1 className="text-4xl font-display text-black mb-12 text-center">Nossos Planos</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {(planos || []).map((plano: PlanoMentoria) => (
            <div key={plano.id} className="bg-white border-2 border-gray-faint rounded-2xl p-8 flex flex-col">
              <div className="mb-6">
                <p className="text-xs font-medium text-blue-600 mb-2">{plano.duracao_meses} MESES</p>
                <h2 className="text-2xl font-display text-black mb-1">{plano.nome}</h2>
                <p className="text-sm mb-4">
                  {plano.codigo.includes('online') ? (
                    <span className="text-blue-600 font-medium">100% Online</span>
                  ) : (
                    <span className="text-gray-text">{plano.foco}</span>
                  )}
                </p>
                <p className="text-xs text-gray-text mb-6">{plano.descricao_encontros}</p>
              </div>

              <div className="space-y-2 mb-8 flex-grow">
                {(plano.itens_inclusos || []).map((item: string, i: number) => (
                  <div key={i} className="flex gap-2 text-sm text-black">
                    <span>✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-faint pt-6 mb-6">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-text">PIX</span>
                    <span className="font-bold text-black">R$ {Number(plano.preco_avista).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-text">Cartão (1x)</span>
                    <span className="font-bold text-black">R$ {Number(plano.preco_cartao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-text">Recorrente</span>
                    <span className="font-bold text-black">{plano.parcelas_recorrente}x R$ {(Number(plano.preco_recorrente_total) / plano.parcelas_recorrente).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <Link
                href={`/checkout?plan=${plano.id}`}
                className="w-full bg-brown-deep text-white py-3 rounded-lg font-medium hover:bg-brown text-center transition"
              >
                Comprar
              </Link>
            </div>
          ))}
        </div>

        {(avisos || []).length > 0 && (
          <div className="mt-16">
            <MuralAtualizado avisos={avisos as Announcement[]} />
          </div>
        )}
      </div>
    </div>
  );
}
