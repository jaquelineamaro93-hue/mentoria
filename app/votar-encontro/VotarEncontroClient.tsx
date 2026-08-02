'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { posthog } from '@/lib/posthog';
import Sidebar from '@/components/Sidebar';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Profile } from '@/lib/types';

const OPCOES_ENCONTROS = [
  { id: 'sao-paulo', label: 'São Paulo' },
  { id: 'rio-janeiro', label: 'Rio de Janeiro' },
  { id: 'belo-horizonte', label: 'Belo Horizonte' },
  { id: 'brasilia', label: 'Brasília' },
];

export default function VotarEncontroClient({
  profile,
}: {
  profile: Profile | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [voto, setVoto] = useState<string | null>(null);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  async function enviarVoto() {
    if (!voto || !aceitouTermos) return;

    setEnviando(true);
    try {
      posthog.capture('voto_encontro_enviado', { voto });
      setEnviado(true);
    } catch (e) {
      console.error(e);
    }
    setEnviando(false);
  }

  if (enviado) {
    return (
      <div className="flex flex-col md:flex-row w-full">
        <Sidebar profile={profile} onSignOut={handleSignOut} />
        <main className="flex-1 px-6 py-8 md:px-12 md:py-12 max-w-3xl mx-auto w-full">
          <div className="text-center py-12">
            <CheckCircle2 size={48} className="text-green-600 mx-auto mb-4" />
            <h1 className="font-display text-2xl text-brown-deep mb-2">Voto registrado!</h1>
            <p className="text-sm text-ink-faint">
              Obrigada por participar. Em breve anuncio qual cidade foi escolhida.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row w-full">
      <Sidebar profile={profile} onSignOut={handleSignOut} />

      <main className="flex-1 px-6 py-8 md:px-12 md:py-12 max-w-3xl mx-auto w-full">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-deep mb-2">
          Participação
        </p>
        <h1 className="font-display text-3xl text-brown-deep mb-1">Onde você quer se encontrar?</h1>
        <p className="text-sm text-ink-faint max-w-xl mb-8">
          Vote na cidade para o próximo encontro presencial da mentoria.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex gap-3">
          <AlertCircle size={18} className="text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-medium mb-1">Regra importante sobre encontros presenciais</p>
            <p>
              Se você faltar a 2 encontros presenciais, você será bloqueado de participar 
              dos 2 próximos encontros. Esse tempo não será reembolsado e não poderá ser recuperado depois.
            </p>
          </div>
        </div>

        <h2 className="font-display text-lg text-brown-deep mb-4">Escolha uma cidade</h2>
        <div className="space-y-2 mb-8">
          {OPCOES_ENCONTROS.map((opcao) => (
            <label
              key={opcao.id}
              className="flex items-center gap-3 p-4 border border-line rounded-lg hover:border-brown-deep cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name="cidade"
                value={opcao.id}
                checked={voto === opcao.id}
                onChange={(e) => setVoto(e.target.value)}
                className="w-4 h-4 text-brown-deep cursor-pointer"
              />
              <span className="text-sm text-brown-deep">{opcao.label}</span>
            </label>
          ))}
        </div>

        <div className="bg-white border border-line rounded-2xl p-5 mb-8">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={aceitouTermos}
              onChange={(e) => setAceitouTermos(e.target.checked)}
              className="w-4 h-4 mt-1 text-brown-deep cursor-pointer"
            />
            <span className="text-sm text-brown-deep">
              Entendo que faltando 2 encontros presenciais, serei bloqueado dos 2 próximos 
              e não terei direito a reembolso por esse período.
            </span>
          </label>
        </div>

        <button
          onClick={enviarVoto}
          disabled={!voto || !aceitouTermos || enviando}
          className="w-full bg-brown-deep text-white py-3 rounded-lg font-medium hover:bg-brown transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {enviando ? 'Enviando...' : 'Registrar meu voto'}
        </button>
      </main>
    </div>
  );
}
