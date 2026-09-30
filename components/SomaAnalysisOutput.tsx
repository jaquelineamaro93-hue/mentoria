'use client';

import { useState } from 'react';
import { Check, Copy, History, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface SomaAnaliseResumo {
  id: string;
  titulo: string | null;
  resultado_markdown: string;
  created_at: string;
}

export default function SomaAnalysisOutput({
  atual,
  historico,
  onSelect,
}: {
  atual: SomaAnaliseResumo | null;
  historico: SomaAnaliseResumo[];
  onSelect: (item: SomaAnaliseResumo) => void;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    if (!atual?.resultado_markdown) return;
    await navigator.clipboard.writeText(atual.resultado_markdown);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 1800);
  }

  if (!atual && historico.length === 0) return null;

  return (
    <div className="grid xl:grid-cols-[minmax(0,1fr)_280px] gap-5 mt-8">
      <section className="rounded-2xl border border-gray-faint bg-white overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-gray-faint px-5 py-4">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles size={17} className="text-mint-deep shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-black truncate">
                {atual?.titulo || 'Resultado da análise'}
              </p>
              {atual?.created_at && (
                <p className="text-xs text-gray-text">
                  {new Date(atual.created_at).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={copiar}
            disabled={!atual}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-faint px-3 py-2 text-xs font-medium text-black hover:border-mint-deep disabled:opacity-40"
          >
            {copiado ? <Check size={14} className="text-mint-deep" /> : <Copy size={14} />}
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
        </div>

        <div className="p-5 md:p-7">
          {atual ? (
            <div className="max-w-none text-sm leading-relaxed text-black
              [&_h1]:font-display [&_h1]:text-2xl [&_h1]:mt-6 [&_h1]:mb-3
              [&_h2]:font-display [&_h2]:text-xl [&_h2]:mt-7 [&_h2]:mb-3
              [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2
              [&_p]:mb-3
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4
              [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4
              [&_li]:mb-1.5
              [&_strong]:font-semibold
              [&_table]:w-full [&_table]:text-xs [&_table]:border-collapse
              [&_th]:border [&_th]:border-gray-faint [&_th]:p-2 [&_th]:text-left
              [&_td]:border [&_td]:border-gray-faint [&_td]:p-2 [&_td]:align-top">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {atual.resultado_markdown}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-gray-text">Selecione uma análise do histórico.</p>
          )}
        </div>
      </section>

      <aside className="rounded-2xl border border-gray-faint bg-white p-4 h-fit">
        <div className="flex items-center gap-2 mb-3">
          <History size={16} className="text-gray-text" />
          <p className="text-sm font-semibold text-black">Histórico</p>
        </div>

        {historico.length === 0 ? (
          <p className="text-xs text-gray-text">Sua primeira análise aparecerá aqui.</p>
        ) : (
          <div className="space-y-2">
            {historico.slice(0, 8).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item)}
                className={[
                  'w-full text-left rounded-lg border px-3 py-2.5 transition',
                  atual?.id === item.id
                    ? 'border-mint-deep bg-mint-light'
                    : 'border-gray-faint hover:border-mint',
                ].join(' ')}
              >
                <p className="text-xs font-medium text-black line-clamp-2">
                  {item.titulo || 'Análise'}
                </p>
                <p className="text-[11px] text-gray-text mt-1">
                  {new Date(item.created_at).toLocaleDateString('pt-BR')}
                </p>
              </button>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
