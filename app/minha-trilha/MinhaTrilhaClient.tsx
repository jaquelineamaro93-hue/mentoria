'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { posthog } from '@/lib/posthog';
import Sidebar from '@/components/Sidebar';
import { Check, Circle, Lock, Star } from 'lucide-react';
import type { CheckinMensal, Profile } from '@/lib/types';

function primeiroDiaDoMes(data: Date): string {
  return new Date(data.getFullYear(), data.getMonth(), 1).toISOString().slice(0, 10);
}

function nomeDoMes(isoDate: string): string {
  const data = new Date(isoDate + 'T00:00:00');
  return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export default function MinhaTrilhaClient({
  profile,
  duracaoMeses,
  dataInicio,
  checkinsIniciais,
}: {
  profile: Profile | null;
  duracaoMeses: number;
  dataInicio: string;
  checkinsIniciais: CheckinMensal[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [checkins, setCheckins] = useState(checkinsIniciais);
  const [nota, setNota] = useState<number | null>(null);
  const [feedbackTexto, setFeedbackTexto] = useState('');
  const [sugestaoMelhoria, setSugestaoMelhoria] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const mesAtualRef = primeiroDiaDoMes(new Date());

  const meses = useMemo(() => {
    const inicio = new Date(dataInicio);
    const lista: { referencia: string; indice: number }[] = [];
    for (let i = 0; i < duracaoMeses; i++) {
      const data = new Date(inicio.getFullYear(), inicio.getMonth() + i, 1);
      lista.push({ referencia: data.toISOString().slice(0, 10), indice: i + 1 });
    }
    return lista;
  }, [dataInicio, duracaoMeses]);

  const jaEnviouEsseMes = checkins.some((c) => c.mes_referencia === mesAtualRef);

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  async function enviarCheckin() {
    if (nota === null) {
      setErro('Escolhe uma nota de 0 a 5 antes de enviar.');
      return;
    }
    if (!feedbackTexto.trim()) {
      setErro('Por favor, escreva um comentario sobre esse mes.');
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch('/api/checkin-mensal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mes_referencia: mesAtualRef,
          nota,
          feedback_texto: feedbackTexto.trim() || null,
          sugestao_melhoria: sugestaoMelhoria.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCheckins((prev) => [...prev, data.checkin]);
      setNota(null);
      setFeedbackTexto('');
      setSugestaoMelhoria('');
      posthog.capture('checkin_mensal_enviado', { nota });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível enviar agora.');
    }
    setEnviando(false);
  }

  return (
    <div className="flex flex-col md:flex-row w-full">
      <Sidebar profile={profile} onSignOut={handleSignOut} />

      <main className="flex-1 px-6 py-8 md:px-12 md:py-12 max-w-3xl mx-auto w-full">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-deep mb-2">
          Sua jornada
        </p>
        <h1 className="font-display text-3xl text-brown-deep mb-1">Minha Trilha</h1>
        <p className="text-sm text-ink-faint max-w-xl mb-10">
          Uma vez por mês, deixa para seu mentor uma nota de 0 a 5 e um comentário. Isso ajuda a ajustar a mentoria conforme necessário.
        </p>

        <div className="relative pl-8 space-y-8">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-line" />

          {meses.map(({ referencia, indice }) => {
            const checkin = checkins.find((c) => c.mes_referencia === referencia);
            const ehMesAtual = referencia === mesAtualRef;
            const ehFuturo = referencia > mesAtualRef;

            return (
              <div key={referencia} className="relative">
                <div
                  className={`absolute -left-8 top-0 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                    checkin
                      ? 'bg-sky-deep border-sky-deep text-white'
                      : ehMesAtual
                        ? 'bg-white border-brown-deep'
                        : 'bg-white border-line'
                  }`}
                >
                  {checkin ? (
                    <Check size={13} />
                  ) : ehFuturo ? (
                    <Lock size={11} className="text-ink-faint" />
                  ) : (
                    <Circle size={9} className="text-brown-deep" />
                  )}
                </div>

                <p className="text-xs uppercase tracking-wide text-ink-faint mb-1">
                  Mês {indice} · {nomeDoMes(referencia)}
                </p>

                {checkin ? (
                  <div className="bg-white border border-line rounded-xl p-4">
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          size={14}
                          className={idx < checkin.nota ? 'fill-amber-400 text-amber-400' : 'text-line'}
                        />
                      ))}
                    </div>
                    {checkin.feedback_texto && (
                      <p className="text-sm text-brown-deep mb-1">{checkin.feedback_texto}</p>
                    )}
                    {checkin.sugestao_melhoria && (
                      <p className="text-xs text-ink-faint">
                        Sugestão: {checkin.sugestao_melhoria}
                      </p>
                    )}
                  </div>
                ) : ehMesAtual && !jaEnviouEsseMes ? (
                  <div className="bg-white border border-brown-deep/30 rounded-xl p-4 space-y-3">
                    <div>
                      <p className="text-xs text-ink-faint mb-2">Como está sendo esse mês para você?</p>
                      <div className="flex gap-1.5">
                        {[0, 1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => setNota(n)}
                            className={`w-9 h-9 rounded-full text-sm border transition-colors ${
                              nota === n
                                ? 'bg-brown-deep text-white border-brown-deep'
                                : 'border-line text-brown-deep hover:border-brown-deep'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      value={feedbackTexto}
                      onChange={(e) => setFeedbackTexto(e.target.value)}
                      placeholder="Como está sendo a mentoria para você esse mês? *"
                      className="w-full text-sm border border-line rounded-lg px-3 py-2 min-h-[70px] focus:outline-none focus:border-brown-deep"
                    />
                    <textarea
                      value={sugestaoMelhoria}
                      onChange={(e) => setSugestaoMelhoria(e.target.value)}
                      placeholder="Alguma sugestão de melhoria? (opcional)"
                      className="w-full text-sm border border-line rounded-lg px-3 py-2 min-h-[60px] focus:outline-none focus:border-brown-deep"
                    />
                    {erro && <p className="text-xs text-red-600">{erro}</p>}
                    <button
                      onClick={enviarCheckin}
                      disabled={enviando}
                      className="bg-brown-deep text-white text-sm px-5 py-2 rounded-lg hover:bg-brown transition-colors disabled:opacity-50"
                    >
                      {enviando ? 'Enviando...' : 'Enviar'}
                    </button>
                  </div>
                ) : ehFuturo ? (
                  <p className="text-sm text-ink-faint">Disponível em {nomeDoMes(referencia)}</p>
                ) : (
                  <p className="text-sm text-ink-faint">Sem check-in registrado nesse mês</p>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
