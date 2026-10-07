'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Lock, Loader2, Award, ShoppingBag, Zap } from 'lucide-react';
import { Panel, Eyebrow } from '@/components/Panel';
import { createClient } from '@/lib/supabase/client';
import { posthog, limparIdentidade } from '@/lib/posthog';
import { SOMA_ACHIEVEMENTS, getNomePilar, getCoresDosPilares } from '@/lib/soma-badges';
import CareerJourney from '@/components/soma/CareerJourney';
import RankingComunidade from './components/RankingComunidade';
import type { Achievement, Profile, Reward, UserAchievement } from '@/lib/types';

type Tab = 'conquistas' | 'loja' | 'ranking';

interface Props {
  profile: Profile | null;
  userId: string;
  conquistas: Achievement[];
  desbloqueadas: UserAchievement[];
  recompensas: Reward[];
  resgatesIniciais: string[];
}

export default function PassaporteClient({
  profile,
  userId,
  conquistas,
  desbloqueadas,
  recompensas,
  resgatesIniciais,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>('conquistas');
  const [resgatando, setResgatando] = useState<string | null>(null);
  const [resgatados, setResgatados] = useState<string[]>(resgatesIniciais);
  const [erroResgate, setErroResgate] = useState<string | null>(null);

  const pontos = profile?.pontos_total ?? 0;
  const idsDesbloqueadas = new Set(desbloqueadas.map((d) => d.achievement_id));

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    limparIdentidade();
    router.push('/login');
    router.refresh();
  }

  async function resgatar(reward: Reward) {
    if (resgatados.includes(reward.id)) return;

    setResgatando(reward.id);
    setErroResgate(null);

    const { error } = await supabase.from('reward_redemptions').insert({
      user_id: userId,
      reward_id: reward.id,
    });

    setResgatando(null);

    if (error) {
      console.error('[PASSAPORTE] Falha ao resgatar recompensa:', error.message);
      setErroResgate('Não foi possível registrar o resgate agora. Seus Impulsos não foram alterados.');
      return;
    }

    posthog.capture('recompensa_resgatada', { reward: reward.titulo });
    setResgatados((prev) => [...prev, reward.id]);
  }

  return (
    <>
      <div className="flex flex-col md:flex-row w-full">

        <main className="flex-1 overflow-auto">
        <div className="px-6 py-10 md:px-12 w-full">
          <p className="text-xs uppercase tracking-[0.2em] text-mint mb-2 bg-mint/10 px-3 py-1.5 rounded-md inline-flex items-center gap-2 border border-mint/20">
            Carreira em movimento
          </p>
          <h1 className="font-display text-3xl text-black mb-8">Meu mapa de carreira</h1>

          <CareerJourney points={pontos} earned={conquistas.filter(item => idsDesbloqueadas.has(item.id)).length} total={conquistas.length} />

          <div className="flex gap-1 mb-6 border-b border-gray-faint overflow-x-auto">
            <button
              onClick={() => setTab('conquistas')}
              className={`py-3 px-4 font-medium text-sm transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
                tab === 'conquistas'
                  ? 'border-mint-deep text-mint'
                  : 'border-transparent text-gray-text hover:text-black'
              }`}
            >
              <Award className="w-4 h-4" />
              Conquistas
            </button>

            <button
              onClick={() => setTab('loja')}
              className={`py-3 px-4 font-medium text-sm transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
                tab === 'loja'
                  ? 'border-mint-deep text-mint'
                  : 'border-transparent text-gray-text hover:text-black'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Impulsos Store
            </button>

            <button
              onClick={() => setTab('ranking')}
              className={`py-3 px-4 font-medium text-sm transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
                tab === 'ranking'
                  ? 'border-mint-deep text-mint'
                  : 'border-transparent text-gray-text hover:text-black'
              }`}
            >
              <Zap className="w-4 h-4" />
              Ranking da Comunidade
            </button>
          </div>

          {tab === 'conquistas' && (
            <div className="space-y-10">
              <section>
                <Eyebrow>Missões que movem sua história</Eyebrow>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {conquistas.map((c) => {
                    const desbloqueada = idsDesbloqueadas.has(c.id);
                    const achievement = SOMA_ACHIEVEMENTS.find(item => item.id === c.codigo);
                    return <article key={c.id} className={`relative overflow-hidden rounded-2xl border p-5 ${desbloqueada ? 'border-[#B6D7C5] bg-[#EEF7F1]' : 'border-gray-faint bg-white'}`}>
                      <div className="flex items-center justify-between"><span className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${desbloqueada ? 'bg-white' : 'bg-[#F4F3EE]'}`}>{achievement?.emoji ?? '✦'}</span><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold ${desbloqueada ? 'bg-[#D6EBDC] text-[#24533C]' : 'bg-gray-100 text-gray-text'}`}>{desbloqueada ? <Check size={12}/> : <Lock size={11}/>} {desbloqueada ? 'Na sua história' : 'Próxima conquista'}</span></div>
                      <h3 className="mt-4 text-sm font-semibold text-black">{c.titulo}</h3>
                      <p className="mt-2 text-xs leading-5 text-gray-text">{achievement?.descricao ?? (desbloqueada ? 'Um passo real que você já deu na sua carreira.' : 'Complete esta ação no portal para avançar na sua jornada.')}</p>
                      <p className="mt-4 text-xs font-bold text-[#386657]">+{c.pontos} Impulsos · {desbloqueada ? 'Conquistados' : 'Esperando seu próximo passo'}</p>
                    </article>;
                  })}
                </div>
              </section>

              <section>
                <Eyebrow>Pilares SOMA</Eyebrow>
                {['sabedoria', 'objetividade', 'maestria', 'alquimia'].map((pilar) => {
                  const badgesDosPilar = SOMA_ACHIEVEMENTS.filter(b => b.pilar === pilar);
                  const cores = getCoresDosPilares();

                  return (
                    <div key={pilar} className="mb-6">
                      <p className="text-sm font-medium mb-2" style={{ color: cores[pilar as keyof typeof cores] }}>
                        {getNomePilar(pilar)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {badgesDosPilar.map((badge) => (
                          <div
                            key={badge.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs"
                            style={{ borderColor: cores[pilar as keyof typeof cores], backgroundColor: cores[pilar as keyof typeof cores] + '10' }}
                            title={badge.descricao}
                          >
                            <span>{badge.emoji}</span>
                            <span style={{ color: cores[pilar as keyof typeof cores] }}>{badge.nome}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </section>
            </div>
          )}

          {tab === 'loja' && (
            <section>
              <Eyebrow>Impulsos Store, troque seus {pontos.toLocaleString('pt-BR')} impulsos por prêmios</Eyebrow>
              {erroResgate && (
                <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {erroResgate}
                </p>
              )}
              <div className="flex flex-col gap-2.5">
                {recompensas.map((r) => {
                  const disponivel = pontos >= r.custo_pontos;
                  const jaResgatado = resgatados.includes(r.id);
                  return (
                    <Panel key={r.id} className="p-4 flex items-center gap-4">
                      <span className="text-sm font-medium text-black min-w-[76px]">
                        {r.custo_pontos.toLocaleString('pt-BR')} pts
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-black mb-0.5">{r.titulo}</p>
                        <p className="text-[11px] uppercase tracking-wide text-gray-text">
                          {r.categoria}
                        </p>
                      </div>
                      {jaResgatado ? (
                        <span className="text-xs text-mint flex items-center gap-1">
                          <Check size={13} /> Resgatado
                        </span>
                      ) : disponivel ? (
                        <button
                          onClick={() => resgatar(r)}
                          disabled={resgatando === r.id}
                          className="flex items-center gap-1.5 text-xs bg-brown hover:bg-brown-deep text-white px-3.5 py-1.5 rounded-full transition-colors disabled:opacity-60"
                        >
                          {resgatando === r.id && <Loader2 size={12} className="animate-spin" />}
                          Resgatar
                        </button>
                      ) : (
                        <span className="text-xs text-gray-text whitespace-nowrap">
                          Faltam {(r.custo_pontos - pontos).toLocaleString('pt-BR')}
                        </span>
                      )}
                    </Panel>
                  );
                })}
              </div>
            </section>
          )}

          {tab === 'ranking' && (
            <section>
              <RankingComunidade conquistas={conquistas} />
            </section>
          )}
        </div>
      </main>
    </div>
    </>
  );
}
