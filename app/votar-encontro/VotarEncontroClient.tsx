'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { posthog } from '@/lib/posthog';
import Sidebar from '@/components/Sidebar';
import { AlertCircle, CheckCircle2, Users } from 'lucide-react';
import type { Profile } from '@/lib/types';

const DATAS_ENCONTROS = [
  { id: '22-08', label: 'Sábado, 22 de agosto', data: '2026-08-22' },
  { id: '29-08', label: 'Sábado, 29 de agosto', data: '2026-08-29' },
  { id: '05-09', label: 'Sábado, 5 de setembro', data: '2026-09-05' },
];

const HORARIO = '11:30 às 17h';
const LOCAL = 'Pinheiros, São Paulo';

interface VotoEncontro {
  id: string;
  user_id: string;
  data_escolhida: string;
  nome_mentorado: string;
  created_at: string;
}

export default function VotarEncontroClient({
  profile,
}: {
  profile: Profile | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [voto, setVoto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [votos, setVotos] = useState<VotoEncontro[]>([]);
  const [jaSeuVoto, setJaSeuVoto] = useState(false);
  const [aba, setAba] = useState<'online' | 'presencial'>('presencial');

  const ehPresencial = profile?.tipo_pacote === 'presencial';

  useEffect(() => {
    carregarVotos();
  }, [profile]);

  async function carregarVotos() {
    if (!profile?.id) return;

    const { data } = await supabase
      .from('votos_encontro')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setVotos(data);
      const meuVoto = data.find((v) => v.user_id === profile.id);
      if (meuVoto) {
        setJaSeuVoto(true);
        setVoto(meuVoto.data_escolhida);
      }
    }
  }

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  async function enviarVoto() {
    if (!voto || jaSeuVoto) return;

    setEnviando(true);
    try {
      const { error } = await supabase.from('votos_encontro').insert({
        user_id: profile?.id,
        data_escolhida: voto,
        nome_mentorado: profile?.nome || 'Mentorado',
      });

      if (!error) {
        posthog.capture('voto_encontro_enviado', { data: voto });
        setEnviado(true);
        await carregarVotos();
      }
    } catch (e) {
      console.error(e);
    }
    setEnviando(false);
  }

  if (enviado && jaSeuVoto) {
    return (
      <div className="flex flex-row w-full h-screen">
        <Sidebar profile={profile} onSignOut={handleSignOut} />
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-12 w-full">
          <div className="text-center py-12">
            <CheckCircle2 size={48} className="text-green-600 mx-auto mb-4" />
            <h1 className="font-display text-2xl text-brown-deep mb-2">Seu voto foi registrado!</h1>
            <p className="text-sm text-ink-faint mb-8">
              Você escolheu o sábado {DATAS_ENCONTROS.find((d) => d.id === voto)?.label?.split(',')[1]}.
            </p>
            <p className="text-sm text-ink-faint">
              Acompanhe aqui quem mais já votou e qual data está vencendo. 💪
            </p>
          </div>
        </main>
      </div>
    );
  }

  const contagemVotos = DATAS_ENCONTROS.map((data) => ({
    ...data,
    count: votos.filter((v) => v.data_escolhida === data.id).length,
  }));

  return (
    <div className="flex flex-row w-full h-screen">
      <Sidebar profile={profile} onSignOut={handleSignOut} />

      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-12 w-full">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-deep mb-2">Participação</p>
        <h1 className="font-display text-3xl text-brown-deep mb-1">Qual é o melhor dia?</h1>
        <p className="text-sm text-ink-faint max-w-xl mb-8">
          Vote no sábado que funciona melhor para você. Encontro em {LOCAL}, das {HORARIO}.
        </p>

        <div className="flex gap-4 mb-8 border-b border-line">
          <button
            onClick={() => setAba('online')}
            className={`pb-3 px-4 font-medium transition ${
              aba === 'online'
                ? 'border-b-2 border-brown text-brown-deep'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            Encontros Online
          </button>
          <button
            onClick={() => setAba('presencial')}
            className={`pb-3 px-4 font-medium transition ${
              aba === 'presencial'
                ? 'border-b-2 border-brown text-brown-deep'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            Encontros Presenciais
          </button>
        </div>

        {aba === 'online' && (
          <div className="bg-paper border border-line rounded-2xl p-6 mb-8">
            <h2 className="font-display text-lg text-brown-deep mb-2">Encontros online</h2>
            <p className="text-sm text-ink-soft">
              Os encontros online são marcados direto pela mentora e avisados no seu Início.
              Não há votação de data aqui por enquanto.
            </p>
          </div>
        )}

        {aba === 'presencial' && !ehPresencial && (
          <div className="bg-sky-tint border border-sky rounded-2xl p-6 mb-8 flex gap-3">
            <AlertCircle size={18} className="text-sky-deep flex-shrink-0 mt-0.5" />
            <div className="text-sm text-sky-deep">
              <p className="font-medium mb-1">Esta votação é do plano presencial</p>
              <p>
                Seu plano é o online, então você não precisa votar nesta data — e também não vai
                receber os e-mails de lembrete do encontro presencial. Se quiser migrar de plano,
                fale com a mentora.
              </p>
            </div>
          </div>
        )}

        {aba === 'presencial' && ehPresencial && (
          <>
        {jaSeuVoto && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-8">
            <p className="text-sm text-green-900">
              ✅ Você já votou no sábado {DATAS_ENCONTROS.find((d) => d.id === voto)?.label}
            </p>
          </div>
        )}

        <h2 className="font-display text-lg text-brown-deep mb-4">Escolha seu dia</h2>
        <div className="space-y-3 mb-8">
          {DATAS_ENCONTROS.map((data) => {
            const count = contagemVotos.find((c) => c.id === data.id)?.count || 0;
            return (
              <label
                key={data.id}
                className="flex items-center gap-3 p-4 border border-line rounded-lg hover:border-brown-deep cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="data"
                  value={data.id}
                  checked={voto === data.id}
                  onChange={(e) => setVoto(e.target.value)}
                  disabled={jaSeuVoto}
                  className="w-4 h-4 text-brown-deep cursor-pointer"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-brown-deep">{data.label}</p>
                  <p className="text-xs text-ink-faint">{HORARIO}</p>
                </div>
                <div className="flex items-center gap-1 bg-sky-deep/10 px-2.5 py-1 rounded-full">
                  <Users size={13} className="text-sky-deep" />
                  <span className="text-xs font-medium text-sky-deep">{count}</span>
                </div>
              </label>
            );
          })}
        </div>

        {!jaSeuVoto && (
          <button
            onClick={enviarVoto}
            disabled={!voto || enviando}
            className="w-full bg-brown-deep text-white py-3 rounded-lg font-medium hover:bg-brown transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enviando ? 'Registrando...' : 'Confirmar meu voto'}
          </button>
        )}

        {votos.length > 0 && (
          <>
            <h3 className="font-display text-sm text-brown-deep mt-8 mb-4">Quem já votou</h3>
            <div className="bg-white border border-line rounded-xl p-4 max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {votos.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between text-sm py-2 border-b border-line last:border-b-0"
                  >
                    <span className="text-brown-deep font-medium">{v.nome_mentorado}</span>
                    <span className="text-xs text-ink-faint">
                      {DATAS_ENCONTROS.find((d) => d.id === v.data_escolhida)?.label?.split(',')[1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
          </>
        )}
      </main>
    </div>
  );
}
