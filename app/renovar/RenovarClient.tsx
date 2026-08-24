'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, ExternalLink, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { posthog, limparIdentidade } from '@/lib/posthog';
import type { PlanoMentoria, Profile } from '@/lib/types';

interface Props {
  profile: Profile | null;
  planos: PlanoMentoria[];
}

type FormaPagamento = 'avista' | 'cartao' | 'recorrente';

export default function RenovarClient({ profile, planos }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [carregando, setCarregando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    limparIdentidade();
    router.push('/login');
    router.refresh();
  }

  async function assinar(planoCodigo: string, formaPagamento: FormaPagamento) {
    const chave = `${planoCodigo}-${formaPagamento}`;
    setCarregando(chave);
    setErro(null);
    try {
      const res = await fetch('/api/mercadopago/criar-assinatura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planoCodigo, formaPagamento }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      posthog.capture('checkout_iniciado', { plano: planoCodigo, forma: formaPagamento });
      window.location.href = data.init_point;
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Não foi possível iniciar o pagamento agora. Entre em contato com seu mentor.'
      );
      setCarregando(null);
    }
  }

  return (
    <div className="min-h-screen w-full px-6 py-12 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-full bg-mint-light border border-mint flex items-center justify-center mx-auto mb-6">
            <Lock size={22} className="text-mint" />
          </div>
          <p className="font-display text-4xl text-black mb-2">
            Escolha seu plano na Mentoria SOMA
          </p>
          <p className="text-sm text-gray-text max-w-lg mx-auto">
            Olá, {profile?.nome?.split(' ')[0] ?? 'futura mentorada'}. Escolha o plano e a
            forma de pagamento que fazem mais sentido para você.
          </p>
        </div>

        {erro && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-300 rounded-md px-4 py-3 mb-6 max-w-lg mx-auto text-center">
            {erro}
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {planos.map((plano) => {
            const valorParcela = plano.preco_recorrente_total / plano.parcelas_recorrente;
            return (
              <div
                key={plano.id}
                className="bg-white border border-gray-faint rounded-2xl p-6 flex flex-col"
              >
                <p className="text-xs uppercase tracking-wide text-mint mb-1">
                  {plano.duracao_meses} meses
                </p>
                <p className="font-display text-2xl text-black mb-1">{plano.nome}</p>
                {plano.foco && (
                  <p className="text-sm text-gray-text mb-4">{plano.foco}</p>
                )}

                {plano.descricao_encontros && (
                  <p className="text-sm text-black mb-4">{plano.descricao_encontros}</p>
                )}

                <ul className="flex flex-col gap-1.5 mb-6">
                  {plano.itens_inclusos.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-text">
                      <Check size={14} className="text-mint mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex flex-col gap-2.5">
                  <button
                    onClick={() => assinar(plano.codigo, 'avista')}
                    disabled={carregando !== null}
                    className="w-full flex items-center justify-between gap-2 bg-brown hover:bg-brown-deep disabled:opacity-60 text-white text-sm font-medium px-5 py-3 rounded-full transition-colors"
                  >
                    <span>À vista</span>
                    <span className="flex items-center gap-1.5">
                      {carregando === `${plano.codigo}-avista` && (
                        <Loader2 size={14} className="animate-spin" />
                      )}
                      R$ {Number(plano.preco_avista).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </button>

                  <button
                    onClick={() => assinar(plano.codigo, 'cartao')}
                    disabled={carregando !== null}
                    className="w-full flex items-center justify-between gap-2 border border-brown text-black hover:bg-brown hover:text-white disabled:opacity-60 text-sm font-medium px-5 py-3 rounded-full transition-colors"
                  >
                    <span>Cartão (1x)</span>
                    <span className="flex items-center gap-1.5">
                      {carregando === `${plano.codigo}-cartao` && (
                        <Loader2 size={14} className="animate-spin" />
                      )}
                      R$ {Number(plano.preco_cartao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </button>

                  <button
                    onClick={() => assinar(plano.codigo, 'recorrente')}
                    disabled={carregando !== null}
                    className="w-full flex items-center justify-between gap-2 border border-gray-faint text-gray-text hover:border-mint hover:text-mint disabled:opacity-60 text-sm font-medium px-5 py-3 rounded-full transition-colors"
                  >
                    <span>Recorrente ({plano.parcelas_recorrente}x)</span>
                    <span className="flex items-center gap-1.5">
                      {carregando === `${plano.codigo}-recorrente` && (
                        <Loader2 size={14} className="animate-spin" />
                      )}
                      R$ {valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <p className="text-xs text-gray-text mb-3">
            Você vai ser levada ao Mercado Pago para concluir o pagamento.
          </p>
          <button
            onClick={handleSignOut}
            className="text-xs text-gray-text hover:text-orange transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
