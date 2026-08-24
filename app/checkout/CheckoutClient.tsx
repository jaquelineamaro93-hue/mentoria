'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { PlanoMentoria } from '@/lib/types';

export default function CheckoutClient({ planos, logado, planoAtualCodigo }: { planos: PlanoMentoria[]; logado: boolean; planoAtualCodigo: string | null }) {
  const searchParams = useSearchParams();
  const [planoSelecionado, setPlanoSelecionado] = useState<string | null>(null);
  const [formaEscolhida, setFormaEscolhida] = useState<'avista' | 'cartao' | 'recorrente' | null>(null);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam) {
      const plano = planos.find(p => p.codigo === planParam);
      if (plano) {
        setPlanoSelecionado(plano.id);
      }
    }
  }, [searchParams, planos]);

  const plano = planos.find((p) => p.id === planoSelecionado);

  async function irParaMercadoPago() {
    if (!plano || !formaEscolhida) return;
    setProcessando(true);
    try {
      const res = await fetch('/api/mercadopago/criar-assinatura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planoCodigo: plano.codigo,
          formaPagamento: formaEscolhida,
        }),
      });
      const data = await res.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else if (data.error) {
        alert(`Erro: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao processar. Tenta de novo.');
    }
    setProcessando(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white to-white py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/planos" className="inline-flex items-center gap-2 text-black hover:text-gray-text mb-6">
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </Link>

        <div className="text-center mb-12">
          <h1 className="font-display text-4xl text-black mb-2">Soma — Mentoria de Carreira</h1>
          <p className="text-lg text-gray-text">Escolha seu plano e comece sua jornada de transformação profissional.</p>
        </div>

        {planoAtualCodigo && (
          <div className="bg-mint-light border border-mint rounded-xl p-4 mb-8 text-center text-sm text-black">
            Você já possui um plano ativo. Ao escolher um novo plano, ele substituirá o anterior ao ser confirmado.
          </div>
        )}

        {logado === false && (
          <div className="bg-white border border-gray-faint rounded-xl p-4 mb-8 text-center text-sm text-black">
            Já é aluna? <a href="/login" className="text-black font-medium underline">Faça login</a> antes de contratar para vincular ao seu perfil.
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {planos.map((p) => {
            const isSelected = planoSelecionado === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setPlanoSelecionado(p.id)}
                className={`border-2 rounded-2xl p-8 cursor-pointer transition-all ${
                  isSelected ? 'border-brown-deep bg-white shadow-lg' : 'border-gray-faint hover:border-brown-deep'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-display text-2xl text-black">{p.nome}</h2>
                    <p className="text-sm">
                      {p.codigo.includes('online') ? (
                        <span className="text-blue-600 font-medium">100% Online</span>
                      ) : (
                        <span className="text-gray-text">{p.foco}</span>
                      )}
                    </p>
                  </div>
                  {isSelected && <Check size={24} className="text-green-600" />}
                </div>
                <p className="text-sm text-gray-text mb-6 leading-relaxed">{p.descricao_encontros}</p>
                <div className="space-y-2 text-sm mb-6">
                  <p className="text-black font-medium">Opções de pagamento:</p>
                  <p className="text-gray-text">
                    R$ {Number(p.preco_avista).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (PIX)
                  </p>
                  <p className="text-gray-text">
                    R$ {Number(p.preco_cartao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no cartão
                  </p>
                  <p className="text-gray-text">
                    R${' '}
                    {(Number(p.preco_recorrente_total) / p.parcelas_recorrente).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    x {p.parcelas_recorrente} recorrente
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {planoSelecionado && plano && (
          <div className="bg-white border-2 border-brown-deep rounded-2xl p-8">
            <h3 className="font-display text-xl text-black mb-6">Como você prefere pagar?</h3>
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <button
                onClick={() => setFormaEscolhida('avista')}
                className={`border-2 rounded-xl p-4 transition-all text-center ${
                  formaEscolhida === 'avista'
                    ? 'border-brown-deep bg-brown-deep/5'
                    : 'border-gray-faint hover:border-brown-deep'
                }`}
              >
                <p className="font-medium text-black mb-2">PIX</p>
                <p className="text-lg font-display text-black">
                  R$ {Number(plano.preco_avista).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </button>
              <button
                onClick={() => setFormaEscolhida('cartao')}
                className={`border-2 rounded-xl p-4 transition-all text-center ${
                  formaEscolhida === 'cartao'
                    ? 'border-brown-deep bg-brown-deep/5'
                    : 'border-gray-faint hover:border-brown-deep'
                }`}
              >
                <p className="font-medium text-black mb-2">Cartão</p>
                <p className="text-lg font-display text-black">
                  R$ {Number(plano.preco_cartao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </button>
              <button
                onClick={() => setFormaEscolhida('recorrente')}
                className={`border-2 rounded-xl p-4 transition-all text-center ${
                  formaEscolhida === 'recorrente'
                    ? 'border-brown-deep bg-brown-deep/5'
                    : 'border-gray-faint hover:border-brown-deep'
                }`}
              >
                <p className="font-medium text-black mb-2">Parcelado</p>
                <p className="text-sm text-gray-text mb-1">{plano.parcelas_recorrente}x de</p>
                <p className="text-lg font-display text-black">
                  R${' '}
                  {(Number(plano.preco_recorrente_total) / plano.parcelas_recorrente).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </button>
            </div>
            {formaEscolhida && (
              <button
                onClick={irParaMercadoPago}
                disabled={processando}
                className="w-full bg-brown-deep text-white font-medium py-4 rounded-lg hover:bg-brown transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processando ? 'Processando...' : planoAtualCodigo ? 'Renovar com Mercado Pago' : 'Continuar com Mercado Pago'}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
