'use client';

import { useState } from 'react';

const PLANOS = [
  {
    id: 'soma-6m',
    title: 'SOMA 6 meses',
    subtitle: 'Movimento e Posicionamento',
    duracao: '6 MESES',
    encontros: '13 encontros: 1 online individual, 6 online coletivos, 6 presenciais coletivos',
    features: [
      'Diagnóstico de Perfil e Carreira',
      'Mapeamento de Talentos',
      'Plano de Ação 90 dias',
      'Presença Profissional (revisão de LinkedIn ou Currículo)',
      'Bônus: Guia Dream Board',
    ],
    precos: {
      vista: 650,
      cartao: 700,
      recorrente: '6x R$ 125,00/mês',
    },
  },
  {
    id: 'soma-12m',
    title: 'SOMA 12 meses',
    subtitle: 'Consistência e Alta Performance',
    duracao: '12 MESES',
    encontros: '14 encontros: 2 online individuais, 12 online coletivos, 12 presenciais coletivos',
    features: [
      'Diagnóstico de Perfil e Carreira',
      'Mapeamento de Talentos',
      'Plano de Ação 90 dias',
      'Presença Profissional (revisão de LinkedIn ou Currículo)',
      'Bônus: Guia Dream Board',
    ],
    precos: {
      vista: 850,
      cartao: 950,
      recorrente: '12x R$ 100,00/mês',
    },
  },
];

export default function PlanosPage() {
  const [planoSelecionado, setPlanoSelecionado] = useState<string | null>(null);
  const [formaPagamento, setFormaPagamento] = useState<'vista' | 'cartao' | 'recorrente' | null>(null);
  const [processando, setProcessando] = useState(false);

  const handleEscolherPlano = (planoId: string) => {
    setPlanoSelecionado(planoId);
    setFormaPagamento(null);
    setTimeout(() => {
      document.getElementById(`checkout-${planoId}`)?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  };

  const handleCheckout = async (plano: typeof PLANOS[0]) => {
    if (!formaPagamento) {
      alert('Por favor, escolha uma forma de pagamento');
      return;
    }

    setProcessando(true);
    try {
      const res = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          external_reference: `${plano.id}_${Date.now()}`,
          plan_id: plano.id,
          payment_type: formaPagamento,
          items: [
            {
              id: plano.id,
              title: plano.title,
              description: plano.subtitle,
              quantity: 1,
              currency_id: 'BRL',
              unit_price: plano.precos[formaPagamento as keyof typeof plano.precos],
            }
          ],
          notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/mercadopago`,
          binary_mode: true,
          statement_descriptor: 'SOMA MENTORIA',
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
      alert('Erro ao iniciar pagamento');
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
            {PLANOS.map((plano) => (
              <div key={plano.id} className="bg-white border-2 border-gray-faint rounded-2xl p-8 flex flex-col">
                <div className="mb-6">
                  <p className="text-xs font-medium text-primary mb-2">{plano.duracao}</p>
                  <h2 className="text-2xl font-display text-black mb-1">{plano.title}</h2>
                  <p className="text-sm text-gray-text mb-4">{plano.subtitle}</p>
                  <p className="text-xs text-gray-text mb-6">{plano.encontros}</p>
                </div>

                <div className="space-y-2 mb-8 flex-grow">
                  {plano.features.map((feature, i) => (
                    <div key={i} className="flex gap-2 text-sm text-black">
                      <span>✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-faint pt-6 mb-6">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-text">À vista</span>
                      <span className="font-bold text-black">R$ {plano.precos.vista.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-text">Cartão (1x)</span>
                      <span className="font-bold text-black">R$ {plano.precos.cartao.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-text">Recorrente</span>
                      <span className="font-bold text-black">{plano.precos.recorrente}</span>
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
            {PLANOS.filter((p) => p.id === planoSelecionado).map((plano) => (
              <div key={plano.id} id={`checkout-${plano.id}`}>
                <div className="bg-white border-2 border-brown-deep rounded-2xl p-8">
                  <h2 className="text-2xl font-display text-black mb-2">{plano.title}</h2>
                  <p className="text-gray-text mb-6">{plano.subtitle}</p>

                  <div className="mb-8 pb-8 border-b border-gray-faint">
                    <p className="text-sm font-medium text-black mb-4">Escolha sua forma de pagamento:</p>
                    <div className="space-y-3">
                      <button
                        onClick={() => setFormaPagamento('vista')}
                        className={`w-full p-4 rounded-lg border-2 text-left transition ${
                          formaPagamento === 'vista'
                            ? 'border-brown-deep bg-brown-deep/5'
                            : 'border-gray-faint hover:border-brown-deep'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-black">À vista (PIX)</span>
                          <span className="font-bold text-black">R$ {plano.precos.vista.toFixed(2)}</span>
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
                          <span className="font-bold text-black">R$ {plano.precos.cartao.toFixed(2)}</span>
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
                          <span className="font-bold text-black">{plano.precos.recorrente}</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCheckout(plano)}
                    disabled={processando || !formaPagamento}
                    className="w-full bg-brown-deep text-white py-3 rounded-lg font-medium hover:bg-brown disabled:opacity-50 transition"
                  >
                    {processando ? 'Processando...' : 'Pagar com Mercado Pago'}
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
