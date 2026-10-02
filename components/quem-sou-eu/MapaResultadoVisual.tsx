'use client';

import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowRight,
  Brain,
  Compass,
  Download,
  FileText,
  GitBranch,
  LayoutGrid,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Panel } from '@/components/Panel';
import { BLOCOS_QUEM_SOU_EU } from '@/lib/prompts';
import { posthog } from '@/lib/posthog';
import type { BussolaPosicionamento, MapaEssencia } from '@/lib/types';

type Tab = 'visual' | 'swot' | 'mental' | 'completo';

interface Props {
  respostas: Record<string, string>;
  mapa: MapaEssencia;
  bussola: BussolaPosicionamento | null;
  gerandoMapa: boolean;
  gerandoBussola: boolean;
  onGerarMapa: () => void;
  onGerarBussola: () => void;
}

function limparTexto(texto?: string | null) {
  if (!texto) return '';
  return texto
    .replace(/\x60{3}[a-zA-Z]*\n?/g, '')
    .replace(/\x60{3}/g, '')
    .replace(/[┌┐└┘├┤┬┴┼│─═╔╗╚╝║]/g, ' ')
    .replace(/^\s{4,}/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizarMarkdown(markdown: string) {
  return markdown
    .replace(/\x60{3}[a-zA-Z]*\n([\s\S]*?)\x60{3}/g, (_match, bloco: string) => {
      const linhas = bloco
        .split('\n')
        .map((linha) =>
          linha
            .replace(/[┌┐└┘├┤┬┴┼│─═╔╗╚╝║]/g, ' ')
            .replace(/^\s+/, '')
            .trim()
        )
        .filter(Boolean);

      return linhas.map((linha) => '- ' + linha).join('\n');
    })
    .replace(/^\s{4,}([^\s].*)$/gm, '$1')
    .replace(/[┌┐└┘├┤┬┴┼│─═╔╗╚╝║]/g, ' ');
}

function resumo(texto: string, limite = 180) {
  const limpo = limparTexto(texto);
  if (limpo.length <= limite) return limpo;
  return limpo.slice(0, limite).trim() + '…';
}

function insights(textos: Array<string | undefined>, limite = 4) {
  const itens = textos
    .flatMap((texto) =>
      limparTexto(texto)
        .split(/\n|(?<=[.!?])\s+/)
        .map((item) => item.replace(/^[-•*]\s*/, '').trim())
    )
    .filter((item) => item.length > 12);

  return [...new Set(itens)].slice(0, limite);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function MapaResultadoVisual({
  respostas,
  mapa,
  bussola,
  gerandoMapa,
  gerandoBussola,
  onGerarMapa,
  onGerarBussola,
}: Props) {
  const [tab, setTab] = useState<Tab>('visual');

  const fluxo = useMemo(
    () => [
      { titulo: 'Essência', texto: resumo(respostas.valores_crencas || '') },
      {
        titulo: 'Potência',
        texto: resumo(
          [respostas.momentos_potencia, respostas.conhecimentos_habilidades]
            .filter(Boolean)
            .join(' ')
        ),
      },
      { titulo: 'Resiliência', texto: resumo(respostas.feridas_forca || '') },
      {
        titulo: 'Direção',
        texto: resumo(
          [respostas.chamados_esquecidos, respostas.contribuicao, respostas.paixoes]
            .filter(Boolean)
            .join(' ')
        ),
      },
      {
        titulo: 'Presença',
        texto: resumo(
          [respostas.presenca_atual, respostas.ciclos_energia].filter(Boolean).join(' ')
        ),
      },
    ],
    [respostas]
  );

  const swot = useMemo(
    () => [
      {
        titulo: 'Forças',
        descricao: 'O que já sustenta você',
        itens: insights([
          respostas.momentos_potencia,
          respostas.feridas_forca,
          respostas.conhecimentos_habilidades,
        ]),
        classe: 'border-emerald-200 bg-emerald-50/70',
      },
      {
        titulo: 'Pontos de atenção',
        descricao: 'O que pede cuidado e gestão',
        itens: insights([
          respostas.ciclos_energia,
          respostas.presenca_atual,
          respostas.valores_crencas,
        ]),
        classe: 'border-amber-200 bg-amber-50/70',
      },
      {
        titulo: 'Oportunidades',
        descricao: 'O que pode ganhar mais espaço',
        itens: insights([
          respostas.chamados_esquecidos,
          respostas.contribuicao,
          respostas.paixoes,
        ]),
        classe: 'border-sky-200 bg-sky-50/70',
      },
      {
        titulo: 'Alertas',
        descricao: 'O que pode limitar seu movimento',
        itens: insights([
          respostas.valores_crencas,
          respostas.ciclos_energia,
          respostas.presenca_atual,
        ]),
        classe: 'border-rose-200 bg-rose-50/70',
      },
    ],
    [respostas]
  );

  const mental = useMemo(
    () => [
      { titulo: 'Essência', subtitulo: 'Valores e crenças', texto: resumo(respostas.valores_crencas || '', 145) },
      { titulo: 'Potência', subtitulo: 'Onde você cresce', texto: resumo(respostas.momentos_potencia || '', 145) },
      { titulo: 'Resiliência', subtitulo: 'O que virou força', texto: resumo(respostas.feridas_forca || '', 145) },
      { titulo: 'Energia', subtitulo: 'Seu ritmo', texto: resumo(respostas.ciclos_energia || '', 145) },
      {
        titulo: 'Direção',
        subtitulo: 'Chamados e contribuição',
        texto: resumo(
          [respostas.chamados_esquecidos, respostas.contribuicao, respostas.paixoes]
            .filter(Boolean)
            .join(' '),
          145
        ),
      },
      { titulo: 'Presença', subtitulo: 'Quem você é hoje', texto: resumo(respostas.presenca_atual || '', 145) },
    ],
    [respostas]
  );

  function exportarPdf() {
    const flowHtml = fluxo
      .map(
        (item, index) =>
          '<div class="card"><span class="number">' +
          String(index + 1) +
          '</span><h3>' +
          escapeHtml(item.titulo) +
          '</h3><p>' +
          escapeHtml(item.texto || 'Sem informação registrada.') +
          '</p></div>'
      )
      .join('');

    const swotHtml = swot
      .map(
        (grupo) =>
          '<div class="card"><h3>' +
          escapeHtml(grupo.titulo) +
          '</h3><p class="muted">' +
          escapeHtml(grupo.descricao) +
          '</p><ul>' +
          grupo.itens.map((item) => '<li>' + escapeHtml(item) + '</li>').join('') +
          '</ul></div>'
      )
      .join('');

    const respostasHtml = BLOCOS_QUEM_SOU_EU.map(
      (item) =>
        '<div class="answer"><h3>' +
        escapeHtml(item.titulo) +
        '</h3><p>' +
        escapeHtml(limparTexto(respostas[item.codigo] || 'Não respondido.')) +
        '</p></div>'
    ).join('');

    const bussolaItens = bussola
      ? [
          ['Norte · Essência', bussola.norte],
          ['Sul · Propósito', bussola.sul],
          ['Leste · Energia', bussola.leste],
          ['Oeste · Mensagem', bussola.oeste],
          ['Centro · Presença', bussola.centro],
        ]
      : [];

    const bussolaHtml = bussolaItens.length
      ? '<section><h2>Bússola de posicionamento</h2><div class="grid">' +
        bussolaItens
          .map(
            (item) =>
              '<div class="card"><h3>' +
              escapeHtml(item[0] || '') +
              '</h3><p>' +
              escapeHtml(limparTexto(item[1] || '')) +
              '</p></div>'
          )
          .join('') +
        '</div></section>'
      : '';

    const popup = window.open('', '_blank', 'noopener,noreferrer');
    if (!popup) return;

    const html =
      '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />' +
      '<title>Mapa Quem Sou Eu · SOMA</title><style>' +
      '@page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#1d242b;margin:0;font-size:10pt;line-height:1.5}' +
      'h1,h2,h3{color:#17212b}h1{font-family:Georgia,serif;font-size:24pt;margin:0 0 4pt}h2{font-family:Georgia,serif;font-size:16pt;margin:20pt 0 9pt;border-bottom:1px solid #dfe5e8;padding-bottom:5pt}' +
      'h3{font-size:10.5pt;margin:0 0 4pt}p{margin:0}.brand{color:#0f8a78;font-size:9pt;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.intro{margin:4pt 0 18pt;color:#66717b}' +
      '.flow{display:grid;grid-template-columns:repeat(5,1fr);gap:7pt}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8pt}.card,.answer{border:1px solid #dfe5e8;border-radius:8pt;padding:9pt;break-inside:avoid}' +
      '.number{width:20pt;height:20pt;border-radius:50%;display:inline-grid;place-items:center;background:#e7f5f1;color:#0f8a78;font-weight:700;margin-bottom:6pt}.muted{color:#66717b;font-size:8.5pt;margin-bottom:5pt}' +
      'ul{margin:5pt 0 0 14pt;padding:0}li{margin-bottom:4pt}.answers{display:grid;gap:7pt}.answer p{white-space:pre-line}</style></head><body>' +
      '<div class="brand">SOMA Mentoria & Carreira</div><h1>Mapa Quem Sou Eu</h1><p class="intro">Síntese visual do seu processo de autoconhecimento.</p>' +
      '<section><h2>Resumo visual</h2><div class="flow">' +
      flowHtml +
      '</div></section><section><h2>Leitura SWOT simplificada</h2><div class="grid">' +
      swotHtml +
      '</div></section>' +
      bussolaHtml +
      '<section><h2>Respostas que formaram o mapa</h2><div class="answers">' +
      respostasHtml +
      '</div></section></body></html>';

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    window.setTimeout(() => popup.print(), 350);
    posthog.capture('mapa_essencia_pdf_exportado');
  }

  const tabs: Array<{ id: Tab; label: string; icon: typeof LayoutGrid }> = [
    { id: 'visual', label: 'Resumo visual', icon: LayoutGrid },
    { id: 'swot', label: 'SWOT', icon: ShieldCheck },
    { id: 'mental', label: 'Mapa mental', icon: Brain },
    { id: 'completo', label: 'Resultado completo', icon: FileText },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="font-display text-2xl text-black">Seu Mapa Quem Sou Eu</p>
          <p className="text-sm text-gray-text mt-1">
            Comece pela visão visual e aprofunde só quando quiser.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onGerarMapa}
            disabled={gerandoMapa}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-faint bg-white px-3.5 py-2.5 text-sm font-medium text-black hover:border-mint-deep disabled:opacity-60"
          >
            {gerandoMapa ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Atualizar síntese
          </button>
          <button
            type="button"
            onClick={exportarPdf}
            className="inline-flex items-center gap-2 rounded-lg bg-mint-deep px-3.5 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            <Download size={15} />
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="border-b border-gray-faint overflow-x-auto" role="tablist" aria-label="Leituras do Mapa Quem Sou Eu">
        <div className="flex gap-2 sm:gap-5 min-w-max">
          {tabs.map((item) => {
            const Icon = item.icon;
            const ativa = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={ativa}
                onClick={() => setTab(item.id)}
                className={[
                  'inline-flex items-center gap-2 pb-3 px-2 text-sm font-medium transition-colors whitespace-nowrap',
                  ativa
                    ? 'border-b-2 border-mint-deep text-black'
                    : 'border-b-2 border-transparent text-gray-text hover:text-black',
                ].join(' ')}
              >
                <Icon size={16} strokeWidth={1.7} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'visual' && (
        <div className="space-y-5">
          <Panel className="p-6 md:p-7">
            <div className="flex items-center gap-2 mb-5">
              <GitBranch size={17} className="text-mint-deep" />
              <div>
                <p className="font-medium text-black">Sua história em fluxo</p>
                <p className="text-xs text-gray-text mt-0.5">
                  Uma leitura rápida do que sustenta quem você é hoje.
                </p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-stretch gap-2">
              {fluxo.map((item, index) => (
                <div key={item.titulo} className="contents">
                  <div className="flex-1 rounded-xl border border-gray-faint bg-white p-4 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-mint-light text-mint-deep grid place-items-center text-xs font-semibold mb-3">
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold text-black mb-2">{item.titulo}</p>
                    <p className="text-xs text-gray-text leading-5">
                      {item.texto || 'Sem informação registrada.'}
                    </p>
                  </div>
                  {index < fluxo.length - 1 && (
                    <div className="hidden lg:grid place-items-center text-gray-text px-0.5">
                      <ArrowRight size={16} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Panel>

          {!bussola ? (
            <Panel className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-black mb-1">Transforme o mapa em direção</p>
                <p className="text-sm text-gray-text max-w-2xl">
                  A Bússola conecta sua essência às decisões de carreira e comunicação.
                </p>
              </div>
              <button
                type="button"
                onClick={onGerarBussola}
                disabled={gerandoBussola}
                className="shrink-0 flex items-center gap-2 bg-mint-deep hover:bg-brown-deep disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg"
              >
                {gerandoBussola ? <Loader2 size={15} className="animate-spin" /> : <Compass size={15} />}
                {gerandoBussola ? 'Gerando...' : 'Gerar bússola'}
              </button>
            </Panel>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="font-display text-xl text-black">Bússola de posicionamento</p>
                  <p className="text-xs text-gray-text mt-1">
                    Como seu autoconhecimento se traduz em direção.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onGerarBussola}
                  disabled={gerandoBussola}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-text hover:text-black"
                >
                  {gerandoBussola ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  Atualizar
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <BussolaCard titulo="Norte · Essência" texto={bussola.norte} />
                <BussolaCard titulo="Sul · Propósito" texto={bussola.sul} />
                <BussolaCard titulo="Leste · Energia" texto={bussola.leste} />
                <BussolaCard titulo="Oeste · Mensagem" texto={bussola.oeste} />
                <BussolaCard titulo="Centro · Presença" texto={bussola.centro} className="sm:col-span-2" />
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'swot' && (
        <div>
          <div className="mb-4">
            <h3 className="font-display text-xl text-black">Leitura SWOT simplificada</h3>
            <p className="text-sm text-gray-text mt-1 max-w-2xl">
              Uma forma simples de separar o que fortalece você, o que pede atenção e o que pode virar oportunidade.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {swot.map((grupo) => (
              <div key={grupo.titulo} className={'rounded-2xl border p-5 ' + grupo.classe}>
                <p className="text-sm font-semibold text-black">{grupo.titulo}</p>
                <p className="text-xs text-gray-text mt-1 mb-4">{grupo.descricao}</p>
                <ul className="space-y-2.5">
                  {(grupo.itens.length ? grupo.itens : ['Sem informação suficiente ainda.']).map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-black leading-6">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-current opacity-50 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'mental' && (
        <Panel className="p-6 md:p-8 overflow-hidden">
          <div className="text-center max-w-xl mx-auto mb-7">
            <p className="font-display text-2xl text-black">Mapa mental de identidade</p>
            <p className="text-sm text-gray-text mt-2">
              Os principais ramos que aparecem nas suas respostas.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-4 items-stretch">
              {mental.slice(0, 3).map((ramo) => <MapaMentalCard key={ramo.titulo} {...ramo} />)}
              <MapaMentalCard {...mental[3]} />
              <div className="rounded-2xl bg-mint-deep text-white p-6 min-h-44 flex flex-col items-center justify-center text-center shadow-sm">
                <Sparkles size={24} className="mb-3" />
                <p className="text-xs uppercase tracking-[0.16em] text-white/70">Centro do mapa</p>
                <p className="font-display text-2xl mt-1">Quem sou eu</p>
                <p className="text-xs text-white/75 mt-2 leading-5">
                  Sua identidade é o encontro desses ramos, não uma única resposta.
                </p>
              </div>
              <MapaMentalCard {...mental[4]} />
              <div className="md:col-start-2"><MapaMentalCard {...mental[5]} /></div>
            </div>
          </div>
        </Panel>
      )}

      {tab === 'completo' && (
        <Panel className="p-6 md:p-8">
          <div className="mb-5 pb-5 border-b border-gray-faint">
            <p className="font-medium text-black">Leitura completa</p>
            <p className="text-sm text-gray-text mt-1">
              A análise detalhada continua disponível, agora sem blocos de código ou caixas escuras.
            </p>
          </div>

          <div className="prose prose-sm max-w-none prose-headings:font-display prose-headings:text-black prose-p:text-black prose-p:leading-7 prose-li:text-black prose-li:leading-6 prose-strong:text-black prose-code:font-sans prose-code:text-black prose-code:bg-transparent prose-code:p-0 prose-pre:bg-transparent prose-pre:text-black prose-pre:border prose-pre:border-gray-faint prose-pre:rounded-xl prose-pre:whitespace-pre-wrap">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {normalizarMarkdown(mapa.conteudo_markdown)}
            </ReactMarkdown>
          </div>
        </Panel>
      )}
    </div>
  );
}

function BussolaCard({
  titulo,
  texto,
  className = '',
}: {
  titulo: string;
  texto: string | null;
  className?: string;
}) {
  return (
    <Panel className={'p-5 ' + className}>
      <p className="text-[11px] uppercase tracking-wide text-mint mb-2">{titulo}</p>
      <p className="text-sm text-black leading-7">{limparTexto(texto)}</p>
    </Panel>
  );
}

function MapaMentalCard({
  titulo,
  subtitulo,
  texto,
}: {
  titulo: string;
  subtitulo: string;
  texto: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-faint bg-white p-5 min-h-44">
      <div className="flex items-center gap-2 mb-3">
        <GitBranch size={15} className="text-mint-deep" />
        <div>
          <p className="text-sm font-semibold text-black">{titulo}</p>
          <p className="text-[11px] text-gray-text mt-0.5">{subtitulo}</p>
        </div>
      </div>
      <p className="text-xs text-gray-text leading-5">{texto || 'Sem informação registrada.'}</p>
    </div>
  );
}
