'use client';

import { useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
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
    <div className="flex flex-col">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-medium text-brown-deep">{secao.titulo}</h2>
          <span className="text-sm text-ink-faint">{concluidos} de {total} concluídos</span>
        </div>
        <div className="w-full bg-cream rounded-full h-2">
          <div className="bg-brown-deep rounded-full h-2 transition-all" style={{ width: `${(concluidos / total) * 100}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <nav className="space-y-2 sticky top-20">
            {secoes.map((s, idx) => (
              <button
                key={s.codigo}
                onClick={() => irParaSecao(idx)}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  idx === passo
                    ? 'bg-sky-tint text-brown-deep border border-sky'
                    : blocosSalvos.has(s.codigo)
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'hover:bg-cream text-ink-faint'
                }`}
              >
                {blocosSalvos.has(s.codigo) && <Check size={16} />}
                <span className="text-xs">{s.titulo}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-paper rounded-xl border border-line p-8">
            <p className="text-ink-faint mb-6">{secao.instrucoes}</p>
            <textarea
              value={respostas[secao.codigo] ?? ''}
              onChange={(e) => setRespostas({ ...respostas, [secao.codigo]: e.target.value })}
              placeholder="Digite sua resposta aqui..."
              className="w-full h-64 border border-line rounded-lg p-4 text-sm focus:outline-none focus:ring-2 focus:ring-brown-deep resize-none"
            />

            {erro && <p className="text-red-600 text-sm mt-4">{erro}</p>}

            <div className="flex gap-4 mt-6">
              {passo > 0 && (
                <button
                  onClick={() => setPasso(passo - 1)}
                  className="px-4 py-2 border border-line rounded-lg hover:bg-cream transition-colors"
                >
                  ← Anterior
                </button>
              )}

              <button
                onClick={() => salvarSecaoAtual()}
                disabled={salvando}
                className="flex items-center gap-2 px-6 py-2 bg-brown-deep hover:bg-brown text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {salvando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {salvando ? 'Salvando...' : foiRespondida ? 'Salvo' : 'Salvar'}
              </button>

              {passo < secoes.length - 1 && (
                <button
                  onClick={() => irParaSecao(passo + 1)}
                  className="ml-auto flex items-center gap-2 px-6 py-2 bg-brown-deep hover:bg-brown text-white rounded-lg transition-colors"
                >
                  Próxima
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
