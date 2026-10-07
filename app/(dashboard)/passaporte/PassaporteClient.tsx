'use client';

import { useState } from 'react';
import { Check, Lock, Loader2, Award, ShoppingBag, Zap } from 'lucide-react';
import { Panel, Eyebrow } from '@/components/Panel';
import { createClient } from '@/lib/supabase/client';
import { posthog } from '@/lib/posthog';
import { SOMA_ACHIEVEMENTS, getNomePilar } from '@/lib/soma-badges';
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
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>('conquistas');
  const [resgatando, setResgatando] = useState<string | null>(null);
  const [resgatados, setResgatados] = useState<string[]>(resgatesIniciais);
  const [erroResgate, setErroResgate] = useState<string | null>(null);

  const pontos = profile?.pontos_total ?? 0;
  const idsDesbloqueadas = new Set(desbloqueadas.map((d) => d.achievement_id));

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

          <div role="tablist" aria-label="Áreas do Passaporte" className="mb-6 grid grid-cols-1 gap-2 rounded-2xl border border-[#DDE6E0] bg-white p-2 sm:grid-cols-3">
            {([
              { id: 'conquistas', label: 'Conquistas', description: 'Sua jornada e próximas missões', Icon: Award },
              { id: 'loja', label: 'Loja de recompensas', description: 'Troque seus Impulsos', Icon: ShoppingBag },
              { id: 'ranking', label: 'Ranking da comunidade', description: 'Celebre a evolução do grupo', Icon: Zap },
            ] as const).map(({ id, label, description, Icon }, index, tabs) => (
              <button key={id} id={`passaporte-tab-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls={`passaporte-panel-${id}`} tabIndex={tab === id ? 0 : -1}
                onClick={() => setTab(id)}
                onKeyDown={(event) => {
                  let next = index;
                  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
                  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + tabs.length - 1) % tabs.length;
                  else if (event.key === 'Home') next = 0;
                  else if (event.key === 'End') next = tabs.length - 1;
                  else return;
                  event.preventDefault();
                  setTab(tabs[next].id);
                  document.getElementById(`passaporte-tab-${tabs[next].id}`)?.focus();
                }}
                className={`flex min-h-[72px] items-center gap-3 rounded-xl px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#183F37] focus-visible:ring-offset-2 ${tab === id ? 'bg-[#183F37] text-white shadow-sm' : 'text-[#334B41] hover:bg-[#EEF5EF]'}`}>
                <Icon size={21} aria-hidden="true" className="shrink-0"/><span><span className="block text-sm font-semibold">{label}</span><span className={`mt-1 block text-xs ${tab === id ? 'text-[#D0E3D9]' : 'text-[#52675B]'}`}>{description}</span></span>
              </button>
            ))}
          </div>
          {(['conquistas', 'loja', 'ranking'] as const).filter(id => id !== tab).map(id => <div key={id} hidden id={`passaporte-panel-${id}`} role="tabpanel" aria-labelledby={`passaporte-tab-${id}`} />)}
          <div id={`passaporte-panel-${tab}`} role="tabpanel" aria-labelledby={`passaporte-tab-${tab}`} tabIndex={0} className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#386657]">
          {tab === 'conquistas' && <CareerJourney points={pontos} earned={conquistas.filter(item => idsDesbloqueadas.has(item.id)).length} total={conquistas.length} />}

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

              <section aria-labelledby="soma-pillars-title">
                <h2 id="soma-pillars-title" className="text-xl font-semibold text-[#183F37]">Quatro forças para sua carreira</h2>
                <p className="mt-2 mb-5 text-sm leading-6 text-[#52675B]">Entenda o que cada ação desenvolve. As descrições ficam visíveis também no celular.</p>
                <div className="grid gap-5 lg:grid-cols-2">
                {(['sabedoria', 'objetividade', 'maestria', 'alquimia'] as const).map((pilar, index) => {
                  const guides = ['Lume · Reconheça suas forças', 'Norte · Transforme intenção em direção', 'Brasa · Construa constância', 'Íris · Abra novas oportunidades'];
                  const accents = ['#E9B95F', '#E79574', '#8AC6B1', '#B9A3DF'];
                  return <article key={pilar} className="overflow-hidden rounded-2xl border border-[#DDE6E0] bg-white">
                    <div className="border-b border-[#E4EAE5] px-5 py-4" style={{borderTop: `4px solid ${accents[index]}`}}>
                      <p className="text-xs font-semibold text-[#52675B]">{guides[index]}</p>
                      <h3 className="mt-1 text-lg font-semibold text-[#183F37]">{getNomePilar(pilar)}</h3>
                    </div>
                    <ul className="divide-y divide-[#E4EAE5] px-5">
                    {SOMA_ACHIEVEMENTS.filter(item => item.pilar === pilar).map(item => {
                      const linked = conquistas.find(c => c.codigo === item.id);
                      const earned = !!linked && idsDesbloqueadas.has(linked.id);
                      return <li key={item.id} className="flex gap-3 py-4"><span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F4F5EF] text-lg">{item.emoji}</span><div><h4 className="text-sm font-semibold text-[#273F34]">{item.nome}</h4><p className="mt-1 text-sm leading-5 text-[#52675B]">{item.descricao}</p>{earned && <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#24533C]"><Check size={12} aria-hidden="true"/>Conquista registrada</span>}</div></li>;
                    })}
                    </ul>
                  </article>;
                })}
                </div>
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
        </div>
      </main>
    </div>
    </>
  );
}
