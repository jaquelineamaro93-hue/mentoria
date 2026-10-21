'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowRight, BookOpen, Check, ClipboardCheck, Copy, FileCheck2,
  FileText, History, Layers3, ListChecks, SearchCheck, Sparkles, Target, TrendingUp,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { SomaAnaliseResumo } from '@/components/SomaAnalysisOutput';
import { dividirRelatorioGupy, extrairNotaSoma, extrairVagasGupy } from '@/lib/gupy-report-parser';
import type { GupySecao } from '@/lib/gupy-report-parser';

type Modo = 'resumo' | 'assuntos' | 'completo' | 'curriculo';
type TextoProps = { children?: React.ReactNode };

function elementosComTag(nodes: React.ReactNode, tag: string): React.ReactElement<TextoProps>[] {
  const encontrados: React.ReactElement<TextoProps>[] = [];
  const buscar = (node: React.ReactNode) => {
    React.Children.forEach(node, filho => {
      if (!React.isValidElement<TextoProps>(filho)) return;
      if (filho.type === tag) encontrados.push(filho);
      else buscar(filho.props.children);
    });
  };
  buscar(nodes);
  return encontrados;
}

function textoPlano(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textoPlano).join(' ');
  if (React.isValidElement<TextoProps>(node)) return textoPlano(node.props.children);
  return '';
}

/**
 * Nos telefones e tablets, tabelas da IA passam a ser cartões rotulados
 * por coluna; no notebook/desktop viram tabelas com respiro e scroll próprio.
 * Nenhuma célula é descartada.
 */
function TabelaLegivel({ children }: TextoProps) {
  const linhas = elementosComTag(children, 'tr');
  const cabecalho = linhas.find(linha => elementosComTag(linha.props.children, 'th').length > 0);
  const colunas = cabecalho
    ? elementosComTag(cabecalho.props.children, 'th').map(celula => textoPlano(celula.props.children))
    : [];
  const registros = linhas
    .map(linha => elementosComTag(linha.props.children, 'td'))
    .filter(celulas => celulas.length > 0);

  return (
    <div className="my-5 min-w-0">
      <div className="space-y-3 xl:hidden">
        {registros.map((celulas, i) => (
          <div key={i} className="rounded-xl border border-gray-faint bg-[#fbfcfc] p-4">
            {celulas.map((celula, j) => (
              <div key={j} className="min-w-0 py-2 first:pt-0 last:pb-0">
                {colunas[j] && (
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[.08em] text-[#61756e]">
                    {colunas[j]}
                  </p>
                )}
                <div className="min-w-0 break-words text-sm leading-6 text-black">
                  {celula.props.children}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="hidden max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-gray-faint xl:block">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-sm leading-6 text-black
          [&_thead]:bg-[#edf6f2]
          [&_th]:border-b [&_th]:border-[#d9e7e1] [&_th]:px-4 [&_th]:py-3 [&_th]:font-semibold
          [&_td]:border-b [&_td]:border-gray-faint [&_td]:px-4 [&_td]:py-3 [&_td]:align-top
          [&_tr:last-child_td]:border-b-0
          [&_tbody_tr:nth-child(even)]:bg-[#fbfcfc]">
          {children}
        </table>
      </div>
      {registros.length === 0 && <p className="text-sm text-gray-text">Tabela sem registros nesta análise.</p>}
    </div>
  );
}

function CorpoDeSecao({ secao }: { secao: GupySecao }) {
  // O cabeçalho numerado se torna título visual; a íntegra fica preservada
  // na cópia e no histórico. Evita que "1. Diagnóstico" vire bullet.
  const corpo = secao.markdown.split('\n').slice(1).join('\n').trim();
  return (
    <>
      <h3 className="mb-5 mt-1 font-display text-2xl leading-tight text-[#183f37] sm:text-3xl">{secao.titulo}</h3>
      {corpo && <MarkdownLegivel markdown={corpo} />}
    </>
  );
}

function MarkdownLegivel({ markdown }: { markdown: string }) {
  return (
    <div className="min-w-0 max-w-none break-words text-[15px] leading-7 text-[#29372f] sm:text-base">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        h1: ({ children }) => <h2 className="mb-4 mt-2 font-display text-2xl leading-snug text-black sm:text-3xl">{children}</h2>,
        h2: ({ children }) => <h3 className="mb-4 mt-7 font-display text-2xl leading-snug text-black">{children}</h3>,
        h3: ({ children }) => <h4 className="mb-3 mt-6 text-base font-semibold leading-snug text-[#183f37]">{children}</h4>,
        h4: ({ children }) => <h5 className="mb-2 mt-5 text-sm font-semibold text-[#183f37]">{children}</h5>,
        p: ({ children }) => <p className="my-3 leading-7">{children}</p>,
        ul: ({ children }) => <ul className="my-4 list-disc space-y-2 pl-5 marker:text-mint-deep">{children}</ul>,
        ol: ({ children }) => <ol className="my-4 list-decimal space-y-2 pl-5 marker:font-semibold marker:text-mint-deep">{children}</ol>,
        li: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-[#1c332a]">{children}</strong>,
        blockquote: ({ children }) => <blockquote className="my-5 rounded-xl border-l-4 border-mint-deep bg-mint-light px-4 py-3 text-[#244b3e]">{children}</blockquote>,
        hr: () => <hr className="my-6 border-gray-faint" />,
        table: ({ children }) => <TabelaLegivel>{children}</TabelaLegivel>,
        pre: ({ children }) => <div className="my-5 min-w-0 overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-[#c8ded5] bg-[#f6faf8] px-4 py-4 font-[family-name:var(--font-body)] text-sm leading-7 text-black">{children}</div>,
        code: ({ children, className }) => <code className={(className || '') + ' whitespace-pre-wrap break-words font-[family-name:var(--font-body)] text-[.92em]'}>{children}</code>,
        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-mint-deep underline underline-offset-2">{children}</a>,
      }}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

const MODOS: { id: Modo; nome: string }[] = [
  { id: 'resumo', nome: 'Visão geral' },
  { id: 'assuntos', nome: 'Por assunto' },
  { id: 'completo', nome: 'Relatório completo' },
  { id: 'curriculo', nome: 'Currículo para copiar' },
];

function botaoEstilo(ativo: boolean) {
  return 'min-h-11 shrink-0 rounded-lg px-3 py-2.5 text-sm font-medium transition ' +
    (ativo ? 'bg-mint-deep text-white shadow-sm' : 'border border-gray-faint bg-white text-[#46594e] hover:border-mint-deep');
}

function GupyRelatorio({ atual }: { atual: SomaAnaliseResumo }) {
  const [modo, setModo] = useState<Modo>('resumo');
  const [secaoAtiva, setSecaoAtiva] = useState(0);
  const [copiado, setCopiado] = useState<string | null>(null);
  const { introducao, secoes } = useMemo(() => dividirRelatorioGupy(atual.resultado_markdown), [atual.resultado_markdown]);
  const nota = useMemo(() => extrairNotaSoma(atual.resultado_markdown), [atual.resultado_markdown]);
  const vagas = useMemo(() => extrairVagasGupy(atual.resultado_markdown), [atual.resultado_markdown]);
  const secaoCurriculo = secoes.filter(s => s.tipo === 'curriculo');
  const diagnostico = secoes.findIndex(s => s.tipo === 'diagnostico');
  const riscos = secoes.findIndex(s => s.tipo === 'riscos');
  const checklist = secoes.findIndex(s => s.tipo === 'checklist');

  async function copiar(texto: string, chave: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(chave);
      window.setTimeout(() => setCopiado(null), 1800);
    } catch {
      setCopiado(null);
    }
  }
  function abrirAssunto(index: number) {
    setModo('assuntos');
    setSecaoAtiva(index >= 0 ? index : 0);
  }

  return (
    <div className="min-w-0 space-y-5">
      <div className="rounded-2xl border border-[#cbe2d9] bg-[#f1f8f5] p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[.13em] text-mint-deep">
          <SearchCheck size={17} aria-hidden="true" /> Auditoria de carreira · SOMA
        </div>
        <h2 className="mb-2 mt-3 font-display text-3xl leading-tight text-[#183f37] sm:text-4xl">
          Sua análise de aderência
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-[#486157]">
          Comece pelos principais indicadores, navegue por assunto ou consulte o relatório integral.
          Todo o conteúdo original da análise continua disponível.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#d9e8e1] bg-white p-4">
            <p className="text-xs font-medium text-[#526b61]">Aderência estimada SOMA</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-[#183f37]">
              {nota !== null ? String(nota) + '/100' : 'Não informada'}
            </p>
            <p className="mt-1 text-xs leading-5 text-[#61756c]">Estimativa própria, não é o score interno da Gupy.</p>
          </div>
          <div className="rounded-xl border border-[#d9e8e1] bg-white p-4">
            <p className="text-xs font-medium text-[#526b61]">Vagas com notas identificadas</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-[#183f37]">{vagas.length || '—'}</p>
            <p className="mt-1 text-xs leading-5 text-[#61756c]">Comparações extraídas do relatório, quando disponíveis.</p>
          </div>
          <div className="rounded-xl border border-[#d9e8e1] bg-white p-4">
            <p className="text-xs font-medium text-[#526b61]">Etapas da análise</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-[#183f37]">{secoes.length}</p>
            <p className="mt-1 text-xs leading-5 text-[#61756c]">Seções detalhadas disponíveis para leitura.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-faint bg-white px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-black">{atual.titulo || 'Resultado da análise'}</p>
          <p className="text-xs text-gray-text">
            {new Date(atual.created_at).toLocaleString('pt-BR')}
          </p>
        </div>
        <button type="button" onClick={() => void copiar(atual.resultado_markdown, 'total')}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-faint px-4 py-2 text-sm font-medium hover:border-mint-deep">
          {copiado === 'total' ? <Check size={16} className="text-mint-deep" /> : <Copy size={16} />}
          {copiado === 'total' ? 'Copiado' : 'Copiar relatório'}
        </button>
      </div>

      <div className="min-w-0 overflow-x-auto overscroll-x-contain rounded-xl border border-gray-faint bg-white p-2" role="tablist" aria-label="Modos de leitura da análise">
        <div className="flex min-w-max gap-2">
          {MODOS.map(item => (
            <button type="button" role="tab" key={item.id} aria-selected={modo === item.id}
              onClick={() => setModo(item.id)} className={botaoEstilo(modo === item.id)}>
              {item.nome}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" className="min-w-0">
        {modo === 'resumo' && (
          <div className="space-y-5">
            {vagas.length > 0 && (
              <section className="rounded-2xl border border-gray-faint bg-white p-5 sm:p-6">
                <h3 className="flex items-center gap-2 font-semibold text-[#183f37]"><Target size={19} className="text-mint-deep" /> Comparativo de vagas</h3>
                <p className="mt-2 text-sm leading-6 text-gray-text">Notas estimadas apresentadas no relatório. Compare os requisitos de cada oportunidade antes de se candidatar.</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {vagas.map(vaga => (
                    <div key={vaga.nome} className="min-w-0 rounded-xl border border-gray-faint bg-[#fbfcfc] p-4">
                      <p className="text-sm font-medium leading-6 text-black">{vaga.nome}</p>
                      <p className="mt-2 text-2xl font-semibold tabular-nums text-mint-deep">{vaga.nota}/100</p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e2ebe7]">
                        <div className="h-full rounded-full bg-mint-deep" style={{ width: vaga.nota + '%' }} />
                      </div>
                      <p className="mt-2 text-xs text-gray-text">Aderência estimada pela SOMA</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
            <section className="grid gap-3 md:grid-cols-3">
              {[
                { title: 'Entenda sua aderência', detail: 'Veja os critérios avaliados e a fundamentação das notas.', icon: TrendingUp, index: diagnostico },
                { title: 'O que melhorar primeiro', detail: 'Requisitos, lacunas e correções específicas da vaga.', icon: Layers3, index: riscos },
                { title: 'Próximos passos', detail: 'Confira a preparação final antes da candidatura.', icon: ClipboardCheck, index: checklist },
              ].map(card => {
                const Icon = card.icon;
                return (
                  <button key={card.title} type="button" onClick={() => abrirAssunto(card.index)}
                    className="flex min-h-40 flex-col items-start rounded-2xl border border-gray-faint bg-white p-5 text-left transition hover:border-mint-deep focus-visible:outline-2">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint-light text-mint-deep"><Icon size={20} /></span>
                    <span className="mt-3 font-semibold text-[#183f37]">{card.title}</span>
                    <span className="mt-1 text-sm leading-6 text-gray-text">{card.detail}</span>
                    <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-semibold text-mint-deep">Explorar <ArrowRight size={14} /></span>
                  </button>
                );
              })}
            </section>
            {introducao && (
              <section className="rounded-2xl border border-gray-faint bg-white p-5 sm:p-6">
                <h3 className="mb-3 font-semibold text-[#183f37]">Apresentação da análise</h3>
                <MarkdownLegivel markdown={introducao} />
              </section>
            )}
          </div>
        )}

        {modo === 'assuntos' && (
          <div className="space-y-4">
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1" aria-label="Assuntos do relatório">
              {secoes.map((secao, index) => (
                <button type="button" key={secao.id} onClick={() => setSecaoAtiva(index)}
                  aria-current={secaoAtiva === index ? 'true' : undefined}
                  className={botaoEstilo(secaoAtiva === index)}>
                  {index + 1}. {secao.titulo}
                </button>
              ))}
            </div>
            {secoes[secaoAtiva] && (
              <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-faint bg-white p-4 sm:p-6 lg:p-7">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-faint pb-4">
                  <p className="text-xs font-semibold uppercase tracking-[.12em] text-mint-deep">
                    Etapa {secaoAtiva + 1} de {secoes.length}
                  </p>
                  <button type="button" onClick={() => void copiar(secoes[secaoAtiva].markdown, 'secao')}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-faint px-3 py-2 text-xs font-medium hover:border-mint-deep">
                    {copiado === 'secao' ? <Check size={14} /> : <Copy size={14} />}
                    {copiado === 'secao' ? 'Copiado' : 'Copiar esta etapa'}
                  </button>
                </div>
                <CorpoDeSecao secao={secoes[secaoAtiva]} />
              </section>
            )}
          </div>
        )}

        {modo === 'completo' && (
          <div className="space-y-4">
            {introducao && (
              <section className="rounded-2xl border border-gray-faint bg-white p-5 sm:p-7">
                <MarkdownLegivel markdown={introducao} />
              </section>
            )}
            {secoes.map((secao, index) => (
              <section key={secao.id} className="min-w-0 overflow-hidden rounded-2xl border border-gray-faint bg-white p-5 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[.12em] text-mint-deep">Etapa {index + 1} de {secoes.length}</p>
                <CorpoDeSecao secao={secao} />
              </section>
            ))}
          </div>
        )}

        {modo === 'curriculo' && (
          <section className="rounded-2xl border border-[#cbe2d9] bg-white p-5 sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-faint pb-4">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-[#183f37]"><FileCheck2 size={20} className="text-mint-deep" /> Versão pronta para revisar</h3>
                <p className="mt-1 text-sm leading-6 text-gray-text">Confira as informações antes de copiar. Não inclua experiências ou números que você não possa comprovar.</p>
              </div>
              {secaoCurriculo.length > 0 && (
                <button type="button" onClick={() => void copiar(secaoCurriculo.map(s => s.markdown).join('\n\n'), 'curriculo')}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-mint-deep px-4 py-2 text-sm font-semibold text-white">
                  {copiado === 'curriculo' ? <Check size={16} /> : <Copy size={16} />}
                  {copiado === 'curriculo' ? 'Copiado' : 'Copiar versão'}
                </button>
              )}
            </div>
            {secaoCurriculo.length > 0
              ? secaoCurriculo.map(secao => <div key={secao.id}><CorpoDeSecao secao={secao} /></div>)
              : <div className="rounded-xl bg-[#f6faf8] p-5 text-sm leading-7 text-[#465e55]">
                  Esta análise não tem uma seção identificada como currículo final.
                  Acesse <button type="button" onClick={() => setModo('completo')} className="font-semibold text-mint-deep underline underline-offset-2">o relatório completo</button> para consultar a versão original.
                </div>}
          </section>
        )}
      </div>
    </div>
  );
}

export default function GupyAnalysisOutput({ atual, historico, onSelect }: {
  atual: SomaAnaliseResumo | null;
  historico: SomaAnaliseResumo[];
  onSelect: (item: SomaAnaliseResumo) => void;
}) {
  if (!atual && !historico.length) return null;
  return (
    <div className="mt-8 grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_250px]" aria-label="Resultado e histórico da análise Gupy">
      <div className="min-w-0">
        {atual ? <GupyRelatorio key={atual.id} atual={atual} /> :
          <p className="rounded-xl border border-gray-faint bg-white p-5 text-sm text-gray-text">Selecione uma análise anterior.</p>}
      </div>
      <aside className="h-fit rounded-2xl border border-gray-faint bg-white p-4 2xl:sticky 2xl:top-5">
        <div className="mb-3 flex items-center gap-2">
          <History size={18} className="text-mint-deep" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-[#183f37]">Análises anteriores</h2>
        </div>
        <p className="mb-4 text-xs leading-5 text-gray-text">Acesse resultados anteriores sem perder os relatórios salvos.</p>
        {historico.length === 0 ? <p className="text-sm text-gray-text">Seu histórico aparece aqui.</p> :
          <div className="space-y-2">
            {historico.slice(0, 8).map(item => (
              <button key={item.id} type="button" onClick={() => onSelect(item)}
                aria-current={atual?.id === item.id ? 'true' : undefined}
                className={'w-full rounded-xl border px-4 py-3 text-left transition ' +
                  (atual?.id === item.id ? 'border-mint-deep bg-mint-light' : 'border-gray-faint hover:border-mint-deep')}>
                <span className="flex items-start gap-2">
                  <FileText size={15} className="mt-0.5 shrink-0 text-mint-deep" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium leading-5 text-black">{item.titulo || 'Análise Gupy'}</span>
                    <span className="mt-1 block text-xs text-gray-text">{new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
                  </span>
                </span>
              </button>
            ))}
          </div>}
        <div className="mt-5 flex items-center gap-2 border-t border-gray-faint pt-4 text-xs leading-5 text-[#61756c]">
          <BookOpen size={16} className="shrink-0 text-mint-deep" />
          <span>O relatório integral continua salvo na sua conta.</span>
        </div>
      </aside>
    </div>
  );
}
