'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { Panel } from '@/components/Panel';
import { createClient } from '@/lib/supabase/client';
import { posthog, limparIdentidade } from '@/lib/posthog';
import { PlanoGerado } from '@/components/pdi/PlanoGerado';
import type { PdiGuiaSecao, PdiResposta, Profile } from '@/lib/types';

interface Props {
  profile: Profile | null;
  userId: string;
  secoes: PdiGuiaSecao[];
  respostasIniciais: PdiResposta[];
}

export default function PdiClient({ profile, userId, secoes, respostasIniciais }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const respostasMap: Record<string, string> = {};
  respostasIniciais.forEach((r) => {
    respostasMap[r.secao] = r.dados?.texto ?? '';
  });

  const [respostas, setRespostas] = useState<Record<string, string>>(respostasMap);
  const primeiroNaoRespondido = secoes.findIndex((s) => !respostasMap[s.codigo]?.trim());
  const [passo, setPasso] = useState(
    primeiroNaoRespondido === -1 ? Math.max(0, secoes.length - 1) : primeiroNaoRespondido
  );
  const [blocosSalvos, setBlocosSalvos] = useState<Set<string>>(
    new Set(respostasIniciais.filter((r) => r.dados?.texto?.trim()).map((r) => r.secao))
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const secao = secoes[passo];
  const total = secoes.length;
  const concluidos = blocosSalvos.size;

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    limparIdentidade();
    router.push('/login');
    router.refresh();
  }

  async function salvarSecaoAtual(): Promise<boolean> {
    const texto = respostas[secao.codigo]?.trim();
    if (!texto) return false;

    setSalvando(true);
    setErro(null);
    const { error } = await supabase.from('pdi_respostas').upsert(
      {
        user_id: userId,
        secao: secao.codigo,
        dados: { texto },
        concluido: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,secao' }
    );
    setSalvando(false);

    if (error) {
      setErro('Não consegui salvar essa seção. Confira sua internet e tente de novo.');
      return false;
    }

    setBlocosSalvos((prev) => new Set(prev).add(secao.codigo));
    posthog.capture('pdi_secao_salva', { secao: secao.codigo });
    return true;
  }

  async function irParaSecao(indice: number) {
    if (indice === passo) return;
    await salvarSecaoAtual();
    setPasso(indice);
  }

  async function irParaProximo() {
    const salvou = await salvarSecaoAtual();
    if (!salvou) return;
    if (passo < total - 1) setPasso(passo + 1);
    else router.refresh();
  }

  if (!secao) {
    return (
      <div className="flex flex-col md:flex-row w-full">
        <Sidebar profile={profile} onSignOut={handleSignOut} />
        <main className="flex-1 px-6 py-10 md:px-12">
          <p className="text-sm text-ink-faint">Nenhuma seção configurada ainda.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row w-full">
      <Sidebar profile={profile} onSignOut={handleSignOut} />

      <div className="flex-1 flex">
        <div className="hidden lg:block w-[260px] shrink-0 border-r border-line p-8 overflow-y-auto">
          <p className="text-[11px] uppercase tracking-wide text-ink-faint mb-4">
            {concluidos} de {total} seções concluídas
          </p>
          <div className="flex flex-col gap-1">
            {secoes.map((s, i) => {
              const respondido = blocosSalvos.has(s.codigo);
              const ativo = i === passo;
              return (
                <button
                  key={s.codigo}
                  onClick={() => irParaSecao(i)}
                  className={`flex items-center gap-2.5 text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    ativo ? 'bg-sky-tint text-brown-deep' : 'text-ink-soft hover:bg-cream'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] shrink-0 ${
                      respondido
                        ? 'bg-brown border-brown text-paper'
                        : 'border-line text-ink-faint'
                    }`}
                  >
                    {respondido ? <Check size={10} /> : i + 1}
                  </span>
                  {s.titulo}
                </button>
              );
            })}
          </div>
        </div>

        <main className="flex-1 px-6 py-10 md:px-12 max-w-5xl mx-auto w-full">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-deep mb-2">
            Meu PDI · seção {passo + 1} de {total}
          </p>
          <h1 className="font-display text-3xl text-brown-deep mb-4">{secao.titulo}</h1>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2.5 mb-4">
              {erro}
            </p>
          )}

          <Panel className="p-6">
            {secao.instrucoes && (
              <p className="text-sm text-ink leading-relaxed mb-4">{secao.instrucoes}</p>
            )}

            <textarea
              value={respostas[secao.codigo] ?? ''}
              onChange={(e) =>
                setRespostas((prev) => ({ ...prev, [secao.codigo]: e.target.value }))
              }
              rows={7}
              placeholder="Escreva sua resposta aqui..."
              className="w-full bg-cream border border-line rounded-lg px-4 py-3 text-sm text-ink focus:border-sky-deep resize-none"
            />

            <div className="flex items-center justify-between mt-5">
              <button
                onClick={() => irParaSecao(Math.max(0, passo - 1))}
                disabled={passo === 0}
                className="flex items-center gap-1.5 text-sm text-ink-faint hover:text-brown disabled:opacity-40 transition-colors"
              >
                Voltar
              </button>

              <button
                onClick={irParaProximo}
                disabled={salvando || !respostas[secao.codigo]?.trim()}
                className="flex items-center gap-2 bg-brown hover:bg-brown-deep disabled:opacity-50 text-paper text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
              >
                {salvando ? <Loader2 size={15} className="animate-spin" /> : null}
                {passo < total - 1 ? (
                  <>
                    Salvar e continuar <ArrowRight size={15} />
                  </>
                ) : (
                  <>
                    Salvar última seção <Check size={15} />
                  </>
                )}
              </button>
            </div>
          </Panel>

          {concluidos === total && (
            <div className="mt-8">
              <div className="bg-sky-tint border border-sky rounded-lg p-6 text-center mb-6">
                <h2 className="text-xl font-display text-brown-deep mb-2">
                  🎉 Você completou seu PDI!
                </h2>
                <p className="text-sm text-ink-soft">
                  Aqui embaixo está seu plano de ação, gerado a partir de tudo que você escreveu:
                  pilares, metas SMART e roadmap.
                </p>
              </div>
              <Panel className="p-6">
                <PlanoGerado mentoradoId={userId} />
              </Panel>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
