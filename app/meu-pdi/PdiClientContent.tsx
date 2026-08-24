'use client';

import { useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Panel } from '@/components/Panel';
import { posthog } from '@/lib/posthog';
import type { PdiGuiaSecao, PdiResposta, Profile } from '@/lib/types';

interface Props {
  profile: Profile | null;
  userId: string;
  secoes: PdiGuiaSecao[];
  respostasIniciais: PdiResposta[];
}

export default function PdiClientContent({ profile, userId, secoes, respostasIniciais }: Props) {
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
    const salvo = await salvarSecaoAtual();
    if (salvo || respostas[secao.codigo]?.trim()) setPasso(indice);
  }

  if (!secao) return <div className="text-center py-12">Carregando seções...</div>;

  const foiRespondida = blocosSalvos.has(secao.codigo);

  return (
    <div className="flex-1 flex">
      <div className="hidden lg:block w-[260px] shrink-0 border-r border-gray-faint p-8 overflow-y-auto">
        <p className="text-[11px] uppercase tracking-wide text-gray-text mb-4">
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
                  ativo ? 'bg-mint-light text-black' : 'text-gray-text hover:bg-white'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] shrink-0 ${
                    respondido
                      ? 'bg-brown border-brown text-paper'
                      : 'border-gray-faint text-gray-text'
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
        <p className="text-xs uppercase tracking-[0.2em] text-mint mb-2">
          Meu PDI · seção {passo + 1} de {total}
        </p>
        <h1 className="font-display text-3xl text-black mb-4">{secao.titulo}</h1>

        {erro && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2.5 mb-4">
            {erro}
          </p>
        )}

        <Panel className="p-6">
          {secao.instrucoes && (
            <p className="text-sm text-black leading-relaxed mb-4">{secao.instrucoes}</p>
          )}

          <textarea
            value={respostas[secao.codigo] ?? ''}
            onChange={(e) => setRespostas({ ...respostas, [secao.codigo]: e.target.value })}
            placeholder="Digite sua resposta aqui..."
            className="w-full h-64 border border-gray-faint rounded-lg p-4 text-sm focus:outline-none focus:ring-2 focus:ring-brown-deep resize-none"
          />
        </Panel>

        <div className="flex gap-4 mt-6">
          {passo > 0 && (
            <button
              onClick={() => setPasso(passo - 1)}
              className="px-4 py-2 border border-gray-faint rounded-lg hover:bg-white transition-colors"
            >
              ← Anterior
            </button>
          )}

          <button
            onClick={() => salvarSecaoAtual()}
            disabled={salvando}
            className="flex items-center gap-2 px-6 py-2 bg-brown-deep hover:bg-brown text-paper rounded-lg transition-colors disabled:opacity-50"
          >
            {salvando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {salvando ? 'Salvando...' : foiRespondida ? 'Salvo' : 'Salvar'}
          </button>

          {passo < secoes.length - 1 && (
            <button
              onClick={() => irParaSecao(passo + 1)}
              className="ml-auto flex items-center gap-2 px-6 py-2 bg-brown-deep hover:bg-brown text-paper rounded-lg transition-colors"
            >
              Próxima
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
