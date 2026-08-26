'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { posthog } from '@/lib/posthog';
import { Calendar, Users, Video, FileText, Clock } from 'lucide-react';
import type { Profile, PlanoMentoria } from '@/lib/types';

export default function MeuPlanoClient({
  profile,
  plano,
}: {
  profile: Profile | null;
  plano: PlanoMentoria | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  if (!plano) {
    return (
      <>
        <p className="text-sm text-gray-text">
          Seu plano será ativado em breve. Você receberá um aviso por email.
        </p>
      </>
    );
  }

  const mesesRestantes = plano.duracao_meses;
  const encontrosOnlineIndividuais = plano.duracao_meses === 6 ? 7 : 10;
  const encontrosOnlineColetivos = plano.duracao_meses === 6 ? 6 : 12;
  const encontrosPresenciais = plano.duracao_meses === 6 ? 6 : 12;

  return (
    <>
      

      <div className="bg-white border border-gray-faint rounded-2xl p-6 mb-8">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-xs text-gray-text mb-1">Duração total</p>
            <p className="text-2xl font-display text-black">{mesesRestantes} meses</p>
          </div>
          <div>
            <p className="text-xs text-gray-text mb-1">Status</p>
            <p className="text-sm font-medium text-green-600">Ativo</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4">
          <p className="text-xs text-gray-text mb-3">Opções de investimento:</p>
          <div className="space-y-1 text-sm">
            <p className="text-black">
              <span className="font-medium">À vista:</span> R$ {Number(plano.preco_avista).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-black">
              <span className="font-medium">Cartão:</span> R$ {Number(plano.preco_cartao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-black">
              <span className="font-medium">Recorrente:</span> {plano.parcelas_recorrente}x de R$ {(Number(plano.preco_recorrente_total) / plano.parcelas_recorrente).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-text">
          {plano.duracao_meses === 6 ? (
            <>
              <p>✓ 7 encontros online individuais</p>
              <p>✓ 6 encontros presenciais coletivos (sábados, Pinheiros/SP)</p>
              <p>✓ 6 encontros online coletivos</p>
              <p className="text-xs mt-3 pt-3 border-t border-gray-faint">Sessão extra individual: R$ 200,00 (cobrada via Mercado Pago)</p>
            </>
          ) : (
            <>
              <p>✓ 10 encontros online individuais</p>
              <p>✓ 12 encontros presenciais coletivos (sábados, Pinheiros/SP)</p>
              <p>✓ 12 encontros online coletivos</p>
              <p className="text-xs mt-3 pt-3 border-t border-gray-faint">Sessão extra individual: R$ 200,00 (cobrada via Mercado Pago)</p>
            </>
          )}
        </div>
      </div>

      <h2 className="font-display text-xl text-black mb-4">O que você tem incluído</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-faint rounded-xl p-4">
          <Video size={18} className="text-mint mb-2" />
          <p className="text-sm font-medium text-black mb-1">Encontros online</p>
          <p className="text-2xl font-display text-black mb-2">{encontrosOnlineIndividuais + encontrosOnlineColetivos}</p>
          <p className="text-xs text-gray-text">{encontrosOnlineIndividuais} individual + {encontrosOnlineColetivos} coletivos</p>
        </div>

        <div className="bg-white border border-gray-faint rounded-xl p-4">
          <Users size={18} className="text-mint mb-2" />
          <p className="text-sm font-medium text-black mb-1">Encontros presenciais</p>
          <p className="text-2xl font-display text-black mb-2">{encontrosPresenciais}</p>
          <p className="text-xs text-gray-text">Troca de experiências em grupo</p>
        </div>

        <div className="bg-white border border-gray-faint rounded-xl p-4">
          <FileText size={18} className="text-mint mb-2" />
          <p className="text-sm font-medium text-black mb-1">Ferramentas incluídas</p>
          <p className="text-xs text-gray-text">PDI, Diagnóstico, Mapa Quem Sou Eu, Simulador de CV e mais</p>
        </div>

        <div className="bg-white border border-gray-faint rounded-xl p-4">
          <Clock size={18} className="text-mint mb-2" />
          <p className="text-sm font-medium text-black mb-1">Seu ritmo</p>
          <p className="text-xs text-gray-text">Acesso ao portal 24/7 para trabalhar quando quiser</p>
        </div>
      </div>

      <div className="mt-8 bg-mint-deep/10 border border-mint-deep/30 rounded-2xl p-5">
        <p className="text-sm text-black">
          Tem dúvidas sobre seu plano? Me chama que a gente conversa sobre o melhor caminho pra você.
        </p>
      </div>
    </>
  );
}
