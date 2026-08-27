'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { posthog } from '@/lib/posthog';
import { Tooltip } from '@/components/Tooltip';
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
    <>
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
                      ? 'bg-mint-deep border-mint-deep text-white'
                      : ehMesAtual
                        ? 'bg-white border-brown-deep'
                        : 'bg-white border-gray-faint'
                  }`}
                >
                  {checkin ? (
                    <Check size={13} />
                  ) : ehFuturo ? (
                    <Lock size={11} className="text-gray-text" />
                  ) : (
                    <Circle size={9} className="text-black" />
                  )}
                </div>

                <p className="text-xs uppercase tracking-wide text-gray-text mb-1">
                  Mês {indice} · {nomeDoMes(referencia)}
                </p>

                {checkin ? (
                  <div className="bg-white border border-gray-faint rounded-xl p-4">
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
                      <p className="text-sm text-black mb-1">{checkin.feedback_texto}</p>
                    )}
                    {checkin.sugestao_melhoria && (
                      <p className="text-xs text-gray-text">
                        Sugestão: {checkin.sugestao_melhoria}
                      </p>
                    )}
                  </div>
                ) : ehMesAtual && !jaEnviouEsseMes ? (
                  <div className="bg-white border border-brown-deep/30 rounded-xl p-4 space-y-3">
                    <div>
                      <div className="flex items-center gap-1 mb-2"><p className="text-xs text-gray-text">Como está sendo esse mês para você?</p><Tooltip texto="De 0 a 5: como foi a mentoria este mês" /></div>
                      <div className="flex gap-1.5">
                        {[0, 1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => setNota(n)}
                            className={`w-9 h-9 rounded-full text-sm border transition-colors ${
                              nota === n
                                ? 'bg-brown-deep text-white border-brown-deep'
                                : 'border-gray-faint text-black hover:border-brown-deep'
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
                      className="w-full text-sm border border-gray-faint rounded-lg px-3 py-2 min-h-[70px] focus:outline-none focus:border-brown-deep"
                    />
                    <textarea
                      value={sugestaoMelhoria}
                      onChange={(e) => setSugestaoMelhoria(e.target.value)}
                      placeholder="Alguma sugestão de melhoria? (opcional)"
                      className="w-full text-sm border border-gray-faint rounded-lg px-3 py-2 min-h-[60px] focus:outline-none focus:border-brown-deep"
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
                  <p className="text-sm text-gray-text">Disponível em {nomeDoMes(referencia)}</p>
                ) : (
                  <p className="text-sm text-gray-text">Sem check-in registrado nesse mês</p>
                )}
              </div>
            );
          })}
        </div>
    </>
  );
}
