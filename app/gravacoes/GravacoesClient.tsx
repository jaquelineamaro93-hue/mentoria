'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PlayCircle, Users, User as UserIcon } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase/client';
import { posthog, limparIdentidade } from '@/lib/posthog';
import type { Profile, Recording } from '@/lib/types';

interface Props {
  profile: Profile | null;
  gravacoes: Recording[];
}

type Filtro = 'todas' | 'individual' | 'grupo';

export default function GravacoesClient({ profile, gravacoes }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [filtro, setFiltro] = useState<Filtro>('todas');

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    limparIdentidade();
    router.push('/login');
    router.refresh();
  }

  const filtradas = gravacoes.filter((g) => filtro === 'todas' || g.tipo === filtro);

  return (
    <div className="flex flex-col md:flex-row w-full">
      <Sidebar profile={profile} onSignOut={handleSignOut} />

      <main className="flex-1 px-6 py-10 md:px-12 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-deep mb-2">
          Biblioteca de encontros
        </p>
        <h1 className="font-display text-3xl text-brown-deep mb-1">Gravações</h1>
        <p className="text-sm text-ink-faint mb-8">
          Reveja as sessões sempre que precisar. Tudo fica salvo no Drive do programa.
        </p>

        <div className="flex gap-2 mb-6">
          {(['todas', 'individual', 'grupo'] as Filtro[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
                filtro === f
                  ? 'bg-sky-tint border-sky text-sky-deep'
                  : 'border-line text-ink-soft bg-paper hover:border-line'
              }`}
            >
              {f === 'todas' ? 'Todas' : f === 'individual' ? 'Individuais' : 'Em grupo'}
            </button>
          ))}
        </div>

        {filtradas.length === 0 ? (
          <div className="rounded-xl border border-line bg-paper p-6 text-sm text-ink-faint text-center">
            Nenhuma gravação por aqui ainda. Assim que a Jaque adicionar, aparece nesta lista.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtradas.map((g) => (
              <a
                key={g.id}
                href={g.drive_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-xl border border-line bg-paper px-5 py-4 hover:border-sky transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-sky-tint flex items-center justify-center text-sky-deep shrink-0">
                  <PlayCircle size={22} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-ink mb-1">{g.titulo}</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex items-center gap-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        g.tipo === 'individual'
                          ? 'bg-sky-tint text-sky-deep'
                          : 'bg-[#f1e6d6] text-brown'
                      }`}
                    >
                      {g.tipo === 'individual' ? <UserIcon size={10} /> : <Users size={10} />}
                      {g.tipo === 'individual' ? 'Individual' : 'Grupo'}
                    </span>
                    {g.data_encontro && (
                      <span className="text-xs text-ink-faint">
                        {new Date(g.data_encontro + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-brown shrink-0">Abrir no Drive</span>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
