'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PlanoMentoria } from '@/lib/types';

export default function PlanosPage() {
  const [planos, setPlanos] = useState<PlanoMentoria[]>([]);
  const [planoSelecionado, setPlanoSelecionado] = useState<string | null>(null);
  const [formaPagamento, setFormaPagamento] = useState<'avista' | 'cartao' | 'recorrente' | null>(null);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    const fetchPlanos = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('planos_mentoria')
        .select('*')
        .eq('ativo', true)
        .not('codigo', 'ilike', '%teste%')
        .not('duracao_meses', 'eq', 5)
        .order('duracao_meses', { ascending: true });

      if (data) {
        setPlanos(data as PlanoMentoria[]);
      }
    };

    fetchPlanos();
  }, []);

  const handleEscolherPlano = (planoId: string) => {
    setPlanoSelecionado(planoId);
    setFormaPagamento(null);
    setTimeout(() => {
      document.getElementById(`checkout-${planoId}`)?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  };

  const handleCheckout = async (plano: PlanoMentoria) => {
    if (!formaPagamento) {
      alert('Por favor, escolha uma forma de pagamento');
      return;
    }

    setProcessando(true);
    try {
      const planoCodigo = plano.codigo;
      const res = await fetch('/api/mercadopago/criar-assinatura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planoCodigo,
          formaPagamento,
        }),
      });
      const data = await res.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else if (data.error) {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao processar. Tenta de novo.');
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Seção de Planos */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-display text-black mb-12 text-center">Nossos Planos</h1>

          <div className="grid md:grid-cols-2 gap-8">
            {planos.map((plano) => (
              <div key={plano.id} className="bg-white border-2 border-gray-faint rounded-2xl p-8 flex flex-col">
                <div className="mb-6">
                  <p className="text-xs font-medium text-primary mb-2">{plano.duracao_meses} MESES</p>
                  <h2 className="text-2xl font-display text-black mb-1">{plano.nome}</h2>
                  <p className="text-sm text-gray-text mb-4">{plano.descricao_encontros}</p>
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
                      <span className="text-gray-text">Parcelado</span>
                      <span className="font-bold text-black">{plano.parcelas_recorrente}x R$ {(Number(plano.preco_recorrente_total) / plano.parcelas_recorrente).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleEscolherPlano(plano.id)}
                  className="w-full bg-brown-deep text-white py-3 rounded-lg font-medium hover:bg-brown transition"
                >
                  Escolher Plano
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Seção de Checkout */}
      {planoSelecionado && (
        <div className="border-t border-gray-faint bg-gray-50 p-6">
          <div className="max-w-2xl mx-auto">
            {planos.filter((p) => p.id === planoSelecionado).map((plano) => (
              <div key={plano.id} id={`checkout-${plano.id}`}>
                <div className="bg-white border-2 border-brown-deep rounded-2xl p-8">
                  <h2 className="text-2xl font-display text-black mb-2">{plano.nome}</h2>
                  <p className="text-gray-text mb-6">{plano.descricao_encontros}</p>

                  <div className="mb-8 pb-8 border-b border-gray-faint">
                    <p className="text-sm font-medium text-black mb-4">Escolha sua forma de pagamento:</p>
                    <div className="space-y-3">
                      <button
                        onClick={() => setFormaPagamento('avista')}
                        className={`w-full p-4 rounded-lg border-2 text-left transition ${
                          formaPagamento === 'avista'
                            ? 'border-brown-deep bg-brown-deep/5'
                            : 'border-gray-faint hover:border-brown-deep'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-black">PIX</span>
                          <span className="font-bold text-black">R$ {Number(plano.preco_avista).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </button>

                      <button
                        onClick={() => setFormaPagamento('cartao')}
                        className={`w-full p-4 rounded-lg border-2 text-left transition ${
                          formaPagamento === 'cartao'
                            ? 'border-brown-deep bg-brown-deep/5'
                            : 'border-gray-faint hover:border-brown-deep'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-black">Cartão (1x)</span>
                          <span className="font-bold text-black">R$ {Number(plano.preco_cartao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </button>

                      <button
                        onClick={() => setFormaPagamento('recorrente')}
                        className={`w-full p-4 rounded-lg border-2 text-left transition ${
                          formaPagamento === 'recorrente'
                            ? 'border-brown-deep bg-brown-deep/5'
                            : 'border-gray-faint hover:border-brown-deep'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-black">Parcelado</span>
                          <span className="font-bold text-black">{plano.parcelas_recorrente}x R$ {(Number(plano.preco_recorrente_total) / plano.parcelas_recorrente).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCheckout(plano)}
                    disabled={processando || !formaPagamento}
                    className="w-full bg-brown-deep text-white py-3 rounded-lg font-medium hover:bg-brown disabled:opacity-50 transition"
                  >
                    {processando ? 'Processando...' : 'Continuar com Mercado Pago'}
                  </button>

                  <button
                    onClick={() => setPlanoSelecionado(null)}
                    className="w-full mt-3 text-brown-deep py-2 text-sm hover:underline"
                  >
                    Voltar aos planos
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
