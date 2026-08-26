'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { posthog } from '@/lib/posthog';
import { Copy, Check, Gift, Users } from 'lucide-react';
import type { Indicacao, Profile } from '@/lib/types';

const AMIGOS_POR_SESSAO = 2;

export default function IndiqueUmAmigoClient({
  profile,
  indicacoesIniciais,
}: {
  profile: Profile | null;
  indicacoesIniciais: Indicacao[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [copiado, setCopiado] = useState(false);

  const convertidas = indicacoesIniciais.filter((i) => i.status === 'convertido');
  const pendentes = indicacoesIniciais.filter((i) => i.status === 'pendente');

  const sessoesLiberadas = Math.floor(convertidas.length / AMIGOS_POR_SESSAO);
  const sessoesDisponiveis = sessoesLiberadas - (profile?.sessoes_bonus_resgatadas ?? 0);
  const faltamParaProxima =
    AMIGOS_POR_SESSAO - (convertidas.length % AMIGOS_POR_SESSAO);

  const linkIndicacao = profile?.codigo_indicacao
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/login?ref=${profile.codigo_indicacao}`
    : '';

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  function copiarLink() {
    if (!linkIndicacao) return;
    navigator.clipboard.writeText(linkIndicacao);
    setCopiado(true);
    posthog.capture('link_indicacao_copiado');
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <>
      <p className="text-xs uppercase tracking-[0.2em] text-mint mb-2 bg-mint/10 px-3 py-1.5 rounded-md inline-flex items-center gap-2 border border-mint/20">
          Comunidade SOMA
        </p>
        <h1 className="font-display text-3xl text-black mb-1">Indique um Amigo</h1>
        <p className="text-sm text-gray-text mb-8">
          A cada 2 amigos que assinarem a Mentoria SOMA através do seu link, você
          ganha 1 sessão individual extra comigo.
        </p>

        <div className="bg-white border border-gray-faint rounded-2xl p-6 mb-8">
          <p className="text-xs uppercase tracking-wide text-gray-text mb-2">
            Seu link de indicação
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="flex-1 min-w-[200px] bg-white border border-gray-faint rounded-lg px-4 py-3 text-sm text-black break-all">
              {linkIndicacao || 'Gerando seu link...'}
            </code>
            <button
              onClick={copiarLink}
              disabled={!linkIndicacao}
              className="flex items-center gap-1.5 bg-brown-deep text-white text-sm px-4 py-3 rounded-lg hover:bg-brown transition-colors disabled:opacity-50"
            >
              {copiado ? <Check size={15} /> : <Copy size={15} />}
              {copiado ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-faint rounded-2xl p-5">
            <Users size={18} className="text-mint mb-2" />
            <p className="text-2xl font-display text-black">{convertidas.length}</p>
            <p className="text-xs text-gray-text">amigos convertidos</p>
          </div>
          <div className="bg-white border border-gray-faint rounded-2xl p-5">
            <Gift size={18} className="text-mint mb-2" />
            <p className="text-2xl font-display text-black">{sessoesDisponiveis}</p>
            <p className="text-xs text-gray-text">
              {sessoesDisponiveis === 1 ? 'sessão liberada' : 'sessões liberadas'} para usar
            </p>
          </div>
          <div className="bg-white border border-gray-faint rounded-2xl p-5">
            <p className="text-2xl font-display text-black">{faltamParaProxima}</p>
            <p className="text-xs text-gray-text">
              {faltamParaProxima === 1 ? 'amigo falta' : 'amigos faltam'} para próxima sessão
            </p>
          </div>
        </div>

        {sessoesDisponiveis > 0 && (
          <div className="bg-mint-deep/10 border border-mint-deep/30 rounded-2xl p-5 mb-8">
            <p className="text-sm text-black">
              Você tem {sessoesDisponiveis}{' '}
              {sessoesDisponiveis === 1 ? 'sessão bônus disponível' : 'sessões bônus disponíveis'}.
              Me chama para combinarmos o horário.
            </p>
          </div>
        )}

        <h2 className="font-display text-xl text-black mb-4">Seus indicados</h2>
        {indicacoesIniciais.length === 0 ? (
          <p className="text-sm text-gray-text">
            Ainda não tem ninguém indicado. Compartilha seu link acima para começar.
          </p>
        ) : (
          <div className="space-y-2">
            {pendentes.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between bg-white border border-gray-faint rounded-xl px-4 py-3"
              >
                <div>
                  <p className="text-sm text-black">{i.indicado_nome}</p>
                  <p className="text-xs text-gray-text">{i.indicado_email}</p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                  Aguardando pagamento
                </span>
              </div>
            ))}
            {convertidas.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between bg-white border border-gray-faint rounded-xl px-4 py-3"
              >
                <div>
                  <p className="text-sm text-black">{i.indicado_nome}</p>
                  <p className="text-xs text-gray-text">{i.indicado_email}</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                  Assinante confirmado
                </span>
              </div>
            ))}
          </div>
        )}
      </>
  );
}
