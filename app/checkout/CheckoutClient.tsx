'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import type { PlanoMentoria } from '@/lib/types';

export default function CheckoutClient({
  planos,
  logado,
  planoAtualCodigo,
}: {
  planos: PlanoMentoria[];
  logado: boolean;
  planoAtualCodigo: string | null;
}) {
  const [planoSelecionado, setPlanoSelecionado] = useState<string | null>(null);
  const [formaEscolhida, setFormaEscolhida] = useState<'avista' | 'cartao' | 'recorrente' | null>(null);
  const [processando, setProcessando] = useState(false);

  const plano = planos.find((p) => p.id === planoSelecionado);

  async function irParaMercadoPago() {
    if (!plano || !formaEscolhida) {
      alert('Selecione um plano e forma de pagamento');
      return;
    }

    setProcessando(true);
    try {
      const precoMap: Record<string, number> = {
        avista: Number(plano.preco_avista),
        cartao: Number(plano.preco_cartao),
        recorrente: Number(plano.preco_recorrente_total) / plano.parcelas_recorrente,
      };

      const res = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'checkout@soma.com',
          external_reference: `${plano.id}_${Date.now()}`,
          plan_id: plano.id,
          payment_type: formaEscolhida === 'avista' ? 'vista' : formaEscolhida,
          items: [
            {
              id: plano.id,
              title: plano.nome,
              description: plano.foco || '100% Online',
              quantity: 1,
              currency_id: 'BRL',
              unit_price: precoMap[formaEscolhida],
            },
          ],
          payer: { email: 'checkout@soma.com' },
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
    } catch (e) {
      console.error(e);
      alert('Erro ao processar. Tenta de novo.');
    }
    setProcessando(false);
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
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
              <div className="flex justify-between text-xs">
                <span className="text-gray-text">PIX</span>
                <span className="font-bold">R$ {Number(p.preco_avista).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-text">Cartão</span>
                <span className="font-bold">R$ {Number(p.preco_cartao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-text">Recorrente</span>
                <span className="font-bold">
                  {p.parcelas_recorrente}x R${' '}
                  {(Number(p.preco_recorrente_total) / p.parcelas_recorrente).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {planoSelecionado && (
        <div className="md:col-span-2 bg-white border-2 border-brown-deep rounded-2xl p-8">
          <h3 className="text-xl font-medium text-black mb-6">Forma de Pagamento</h3>
          <div className="space-y-3 mb-8">
            <button
              onClick={() => setFormaEscolhida('avista')}
              className={`w-full p-4 rounded-lg border-2 text-left transition ${
                formaEscolhida === 'avista'
                  ? 'border-brown-deep bg-brown-deep text-white'
                  : 'border-gray-faint hover:border-brown-deep'
              }`}
            >
              PIX
            </button>
            <button
              onClick={() => setFormaEscolhida('cartao')}
              className={`w-full p-4 rounded-lg border-2 text-left transition ${
                formaEscolhida === 'cartao'
                  ? 'border-brown-deep bg-brown-deep text-white'
                  : 'border-gray-faint hover:border-brown-deep'
              }`}
            >
              Cartão (1x)
            </button>
            <button
              onClick={() => setFormaEscolhida('recorrente')}
              className={`w-full p-4 rounded-lg border-2 text-left transition ${
                formaEscolhida === 'recorrente'
                  ? 'border-brown-deep bg-brown-deep text-white'
                  : 'border-gray-faint hover:border-brown-deep'
              }`}
            >
              Recorrente ({plano?.parcelas_recorrente}x)
            </button>
          </div>

          <button
            onClick={irParaMercadoPago}
            disabled={processando || !planoSelecionado || !formaEscolhida || !logado}
            className="w-full bg-brown-deep text-white py-3 rounded-lg font-medium hover:bg-brown disabled:opacity-50 transition"
          >
            {processando ? 'Processando...' : 'Ir para Pagamento'}
          </button>
          {!logado && (
            <p className="text-xs text-gray-text text-center mt-4">
              Faça login antes de prosseguir com o pagamento.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
