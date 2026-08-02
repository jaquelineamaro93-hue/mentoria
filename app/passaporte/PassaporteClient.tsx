'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Lock, Loader2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { Panel, Eyebrow } from '@/components/Panel';
import { createClient } from '@/lib/supabase/client';
import { posthog, limparIdentidade } from '@/lib/posthog';
import type { Achievement, Profile, Reward, UserAchievement } from '@/lib/types';

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
    <div className="flex flex-col md:flex-row w-full">
      <Sidebar profile={profile} onSignOut={handleSignOut} />

      <main className="flex-1 px-6 py-10 md:px-12 max-w-5xl mx-auto w-full">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-deep mb-2">
          Sua jornada em pontos
        </p>
        <h1 className="font-display text-3xl text-brown-deep mb-8">Meu Passaporte</h1>

        <div className="rounded-2xl bg-brown-deep px-8 py-7 mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-[#cbb896] mb-1">
              Pontos acumulados
            </p>
            <p className="font-display text-4xl text-[#f1e6d6]">{pontos}</p>
          </div>
          <p className="text-sm text-[#d9c8ab] max-w-xs">
            Cada meta concluída, anotação registrada ou encontro participado soma pontos aqui.
          </p>
        </div>

        <section className="mb-10">
          <Eyebrow>Conquistas</Eyebrow>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {conquistas.map((c) => {
              const desbloqueada = idsDesbloqueadas.has(c.id);
              return (
                <div key={c.id} className="flex flex-col items-center text-center gap-2.5">
                  <div
                    className={`w-16 h-16 rounded-full border flex items-center justify-center ${
                      desbloqueada
                        ? 'bg-sky-tint border-sky text-sky-deep'
                        : 'bg-paper border-line text-ink-faint opacity-50'
                    }`}
                  >
                    {desbloqueada ? <Check size={22} /> : <Lock size={18} />}
                  </div>
                  <p
                    className={`text-xs ${desbloqueada ? 'text-ink' : 'text-ink-faint'}`}
                  >
                    {c.titulo}
                  </p>
                  <p className="text-[10px] text-ink-faint">+{c.pontos} pts</p>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <Eyebrow>Loja de pontos, troque seus {pontos} pontos por prêmios</Eyebrow>
          <div className="flex flex-col gap-2.5">
            {recompensas.map((r) => {
              const disponivel = pontos >= r.custo_pontos;
              const jaResgatado = resgatados.includes(r.id);
              return (
                <Panel key={r.id} className="p-4 flex items-center gap-4">
                  <span className="text-sm font-medium text-brown-deep min-w-[76px]">
                    {r.custo_pontos.toLocaleString('pt-BR')} pts
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-ink mb-0.5">{r.titulo}</p>
                    <p className="text-[11px] uppercase tracking-wide text-ink-faint">
                      {r.categoria}
                    </p>
                  </div>
                  {jaResgatado ? (
                    <span className="text-xs text-sky-deep flex items-center gap-1">
                      <Check size={13} /> Resgatado
                    </span>
                  ) : disponivel ? (
                    <button
                      onClick={() => resgatar(r)}
                      disabled={resgatando === r.id}
                      className="flex items-center gap-1.5 text-xs bg-brown hover:bg-brown-deep text-paper px-3.5 py-1.5 rounded-full transition-colors disabled:opacity-60"
                    >
                      {resgatando === r.id && <Loader2 size={12} className="animate-spin" />}
                      Resgatar
                    </button>
                  ) : (
                    <span className="text-xs text-ink-faint whitespace-nowrap">
                      Faltam {(r.custo_pontos - pontos).toLocaleString('pt-BR')}
                    </span>
                  )}
                </Panel>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
