'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Lock, Loader2, Award, ShoppingBag, Zap } from 'lucide-react';
import { Panel, Eyebrow } from '@/components/Panel';
import { createClient } from '@/lib/supabase/client';
import { posthog, limparIdentidade } from '@/lib/posthog';
import { SOMA_ACHIEVEMENTS, getNomePilar, getCoresDosPilares } from '@/lib/soma-badges';
import RankingComunidade from './components/RankingComunidade';
import type { Achievement, Profile, Reward, UserAchievement } from '@/lib/types';

type Tab = 'conquistas' | 'loja' | 'ranking';

interface Props {
  profile: Profile | null;
  userId: string;
  conquistas: Achievement[];
  desbloqueadas: UserAchievement[];
  recompensas: Reward[];
}

export default function PassaporteClient({
  profile,
  userId,
  conquistas,
  desbloqueadas,
  recompensas,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>('conquistas');
  const [resgatando, setResgatando] = useState<string | null>(null);
  const [resgatados, setResgatados] = useState<string[]>([]);

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
    setResgatando(reward.id);
    await supabase.from('reward_redemptions').insert({
      user_id: userId,
      reward_id: reward.id,
    });
    posthog.capture('recompensa_resgatada', { reward: reward.titulo });
    setResgatados((prev) => [...prev, reward.id]);
    setResgatando(null);
  }

  return (
    <>
      <div className="">
        <p className="text-xs uppercase tracking-[0.2em] text-mint mb-2 bg-mint/10 px-3 py-1.5 rounded-md inline-flex items-center gap-2 border border-mint/20">
          Sua jornada em pontos
        </p>
        <h1 className="font-display text-3xl text-black mb-8">Meu Passaporte</h1>

        <div className="rounded-2xl bg-brown-deep px-8 py-7 mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#cbb896] mb-1">
                Impulsos acumulados
              </p>
              <p className="font-display text-4xl text-[#f1e6d6]">{pontos.toLocaleString('pt-BR')}</p>
            </div>
            <p className="text-sm text-[#d9c8ab] ">
              Cada meta concluída, anotação registrada ou encontro participado soma impulsos aqui.
            </p>
          </div>

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
                <Eyebrow>Emblemas & Conquistas</Eyebrow>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {conquistas.map((c) => {
                    const desbloqueada = idsDesbloqueadas.has(c.id);
                    const pillarAchievement = SOMA_ACHIEVEMENTS.find(s => s.id === c.codigo);
                    const emoji = pillarAchievement?.emoji || '⭐';
                    return (
                      <div key={c.id} className="flex flex-col items-center text-center gap-2.5">
                        {/* Medal/Shield Badge */}
                        <div className="relative w-20 h-24 flex items-center justify-center">
                          {/* Shield Shape */}
                          <div
                            className={`w-20 h-20 rounded-t-3xl rounded-b-lg border-2 flex items-center justify-center shadow-lg transition-all overflow-hidden ${
                              desbloqueada
                                ? 'bg-gradient-to-br from-brown-emblem to-ink-soft border-brown-deep text-white'
                                : 'bg-gradient-to-br from-white to-white border-gray-faint text-gray-text opacity-60'
                            }`}
                            style={{
                              clipPath: 'polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%)',
                            }}
                          >
                            <span className="text-2xl leading-none">{emoji}</span>
                          </div>
                          {/* Gold Accent (only for unlocked) */}
                          {desbloqueada && (
                            <div
                              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-6 h-6 bg-gold-matte rounded-full border-2 border-brown-emblem flex items-center justify-center"
                              style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                            >
                              <span className="text-xs">★</span>
                            </div>
                          )}
                        </div>
                        <p
                          className={`text-xs font-medium ${desbloqueada ? 'text-black' : 'text-gray-text'}`}
                        >
                          {c.titulo}
                        </p>
                        <p className="text-[10px] text-gray-text">+{c.pontos} Impulsos</p>
                      </div>
                    );
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
              <RankingComunidade />
            </section>
        )}
      </div>
    </>
  );
}
