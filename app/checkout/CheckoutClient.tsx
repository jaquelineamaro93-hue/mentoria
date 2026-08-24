'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { PlanoMentoria } from '@/lib/types';

export default function CheckoutClient({ plano, logado, planoAtualCodigo }: { plano: PlanoMentoria | null; logado: boolean; planoAtualCodigo: string | null }) {
  const [formaEscolhida, setFormaEscolhida] = useState<'avista' | 'cartao' | 'recorrente' | null>(null);
  const [processando, setProcessando] = useState(false);

  if (!plano) {
    return (
      <main className="min-h-screen bg-white py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/planos" className="inline-flex items-center gap-2 text-black hover:text-gray-text mb-6">
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </Link>
          <p className="text-center text-gray-text">Plano não encontrado</p>
        </div>
      </main>
    );
  }

  async function irParaMercadoPago() {
    if (!formaEscolhida) {
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
    <main className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/planos" className="inline-flex items-center gap-2 text-black hover:text-gray-text mb-8">
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </Link>

        <div className="text-center mb-12">
          <h1 className="font-display text-4xl text-black mb-2">{plano.nome}</h1>
          <p className="text-lg text-gray-text">{plano.descricao_encontros}</p>
        </div>

        {planoAtualCodigo && (
          <div className="bg-mint border border-primary rounded-xl p-4 mb-8 text-center text-sm text-black">
            Você já possui um plano ativo. Ao escolher este plano, ele substituirá o anterior.
          </div>
        )}

        <div className="bg-white border-2 border-gray-faint rounded-2xl p-8 mb-8">
          <h2 className="font-display text-2xl text-black mb-6">{plano.nome}</h2>

          <div className="space-y-4 mb-8">
            <div>
              <p className="text-xs font-medium text-primary mb-2">{plano.duracao_meses} MESES</p>
              <p className="text-sm mb-4">
                {plano.codigo.includes('online') ? (
                  <span className="text-primary font-medium">100% Online</span>
                ) : (
                  <span className="text-gray-text">{plano.foco}</span>
                )}
              </p>
            </div>

            <div className="space-y-2">
              {(plano.itens_inclusos || []).map((item: string, i: number) => (
                <div key={i} className="flex gap-2 text-sm text-black">
                  <span>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-faint pt-6">
            <div className="space-y-2">
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
        </div>

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

          <button
            onClick={irParaMercadoPago}
            disabled={processando || !formaEscolhida}
            className="w-full bg-brown-deep text-white font-medium py-4 rounded-lg hover:bg-brown transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processando ? 'Processando...' : 'Continuar com Mercado Pago'}
          </button>
        </div>
      </div>
    </main>
  );
}
