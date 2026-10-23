'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

/**
 * Trechos extraídos dos prints e relatos encaminhados pela criadora da SOMA,
 * que confirmou a autorização para divulgação pública em 22/10/2026.
 * Nomes seguem os identificadores visíveis, sem completar sobrenomes
 * desconhecidos. Preservamos o contexto de mentoria, comunidade ou orientação.
 * Sem telefone, email, conversas de terceiros, garantia de resultado ou
 * atribuição artificial de resultado ao uso do SaaS.
 */
export const HISTORIAS_SOMA = [
  {
    nome: 'Nathalia Ferlin',
    iniciais: 'NF',
    origem: 'Mentoria',
    categoria: 'Aprovação na Gupy',
    texto: 'Queria avisar que passei no processo seletivo, depois de 2 meses buscando emprego. Venci a Gupy.',
    detalhe: 'Recolocação profissional',
  },
  {
    nome: 'Henrique Silva',
    iniciais: 'HS',
    origem: 'Mentoria',
    categoria: 'LinkedIn e recolocação',
    texto: 'Depois de reestruturar melhor meu perfil do LinkedIn e ser mais ativo, consegui me recolocar de volta no mercado.',
    detalhe: 'Nova oportunidade',
  },
  {
    nome: 'Paulo Cézar Silveira',
    iniciais: 'PS',
    origem: 'Mentoria',
    categoria: 'Preparação para entrevistas',
    texto: 'Com uma metodologia simples e assertiva minha performance nas entrevistas evoluiu consideravelmente.',
    detalhe: 'Evolução em entrevistas',
  },
  {
    nome: 'Jéssica Carolina',
    iniciais: 'JC',
    origem: 'Mentoria',
    categoria: 'Transição de carreira',
    texto: 'Depois de algumas entrevistas consegui minha transição. Venci a Gupy.',
    detalhe: 'Transição profissional',
  },
  {
    nome: 'Ari',
    iniciais: 'AR',
    origem: 'Mentoria',
    categoria: 'Aprovação na Gupy',
    texto: 'Venci a Gupy e me recoloquei.',
    detalhe: 'Recolocação profissional',
  },
  {
    nome: 'Erick Almeida',
    iniciais: 'EA',
    origem: 'Mentoria',
    categoria: 'Recolocação',
    texto: 'Consegui um emprego na área que gostaria, agradeço todo o seu apoio.',
    detalhe: 'Conquista profissional',
  },
  {
    nome: 'Rogério',
    iniciais: 'RO',
    origem: 'Mentoria',
    categoria: 'Liderança em CX',
    texto: 'Jaque, deu certo a vaga de CX Lead. Aprovado para analista e CX Lead e nem terminei todos os passos da mentoria.',
    detalhe: 'Aprovação profissional',
  },
  {
    nome: 'Nat',
    iniciais: 'NA',
    origem: 'Mentoria',
    categoria: 'Gupy e Dados',
    texto: 'Venciiii tbm a Gupyyyyy e sou Analista de Dados.',
    detalhe: 'Nova posição em Dados',
  },
  {
    nome: 'Geraldo Macinelli',
    iniciais: 'GM',
    origem: 'Relato recebido',
    categoria: 'Volta ao mercado',
    texto: 'MEU SIM ACABOU DE CHEGAR. Estou de volta no mercado de trabalho.',
    detalhe: 'Recolocação profissional',
  },
  {
    nome: 'Roberto Melo',
    iniciais: 'RM',
    origem: 'Mentoria',
    categoria: 'Currículo e entrevistas',
    texto: 'Depois de reestruturar meu currículo com base no modelo que você propôs, eu recebi mensagem de uma recrutadora marcando uma entrevista.',
    detalhe: 'Convite para entrevista',
  },
  {
    nome: 'Natan',
    iniciais: 'NT',
    origem: 'Mentoria',
    categoria: 'LinkedIn e oportunidades',
    texto: 'Ainda não consegui um emprego na área, mas devido ao meu linkedin formatado e meu selo #OpenToWork, consegui fechar um contrato para configuração de uma Sales Cloud.',
    detalhe: 'Novo contrato profissional',
  },
  {
    nome: 'Ana Júlia',
    iniciais: 'AJ',
    origem: 'Mentoria',
    categoria: 'Novo emprego',
    texto: 'Comecei essa semana em um novo emprego. Valeu pela parceria.',
    detalhe: 'Recolocação profissional',
  },
  {
    nome: 'Gustavo',
    iniciais: 'GU',
    origem: 'Relato recebido',
    categoria: 'LinkedIn e currículo',
    texto: 'Finalmente meu “SIM” chegou e tudo graças às mudanças que fiz no LinkedIn e no currículo.',
    detalhe: 'Recolocação profissional',
  },
  {
    nome: 'Ruth Ribeiro',
    iniciais: 'RR',
    origem: 'Comunidade',
    categoria: 'Currículo e LinkedIn',
    texto: 'Segui tudo direitinho e consegui meu novo emprego. Muito obrigada de coração.',
    detalhe: 'Compartilhamento na comunidade',
  },
  {
    nome: 'Jéssica Torres',
    iniciais: 'JT',
    origem: 'Mentoria',
    categoria: 'Visibilidade no LinkedIn',
    texto: 'Desde que modifiquei meu CV, fiz ajustes no perfil do linkedin e notei que meu perfil tem uma melhora na visibilidade.',
    detalhe: 'Mais visibilidade profissional',
  },
  {
    nome: 'Jaque Ferreira',
    iniciais: 'JF',
    origem: 'Mentoria',
    categoria: 'Aprovação na Gupy',
    texto: 'Vim dizer que acabei de responder o RH. VENCI A GUPY.',
    detalhe: 'Aprovação em processo seletivo',
  },
] as const;

/** Depoimentos públicos anteriores com links de origem informados pela criadora. */
const DEPOIMENTOS_LINKEDIN = [
  { nome: 'Maria Laura Soares', href: 'https://lnkd.in/p/esE9t5fr' },
  { nome: 'Giulia Gomes', href: 'https://lnkd.in/p/eetWmSiv' },
  { nome: 'Rita Alecrim', href: 'https://lnkd.in/p/euSGD_V9' },
] as const;

export default function SomaSuccessStories() {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(true);

  function move(direction: -1 | 1) {
    const container = scroller.current;
    if (!container) return;
    const card = container.querySelector<HTMLElement>('[data-story-card]');
    if (!card) return;
    const gap = parseFloat(getComputedStyle(container).columnGap || '16') || 16;
    const step = card.offsetWidth + gap;
    const max = Math.max(0, container.scrollWidth - container.clientWidth);
    const destination = Math.min(max, Math.max(0, container.scrollLeft + direction * step));
    container.scrollTo({
      left: destination,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }

  function syncActive() {
    const container = scroller.current;
    if (!container) return;
    const card = container.querySelector<HTMLElement>('[data-story-card]');
    if (!card) return;
    const gap = parseFloat(getComputedStyle(container).columnGap || '16') || 16;
    setActive(Math.min(HISTORIAS_SOMA.length - 1, Math.max(0, Math.round(container.scrollLeft / (card.offsetWidth + gap)))));
    setCanGoBack(container.scrollLeft > 2);
    setCanGoForward(container.scrollLeft + container.clientWidth < container.scrollWidth - 2);
  }

  return (
    <section
      id="historias-reais"
      aria-labelledby="historias-soma-titulo"
      className="scroll-mt-24 overflow-hidden bg-[#111b19] py-9 text-white sm:py-12"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#4ac1ae]/30 bg-[#0D8071]/20 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#8fe1d3]">
              <Quote size={15} aria-hidden="true" />
              Histórias recebidas, resultados reais
            </p>
            <h2 id="historias-soma-titulo" className="font-display text-3xl leading-tight sm:text-4xl">
              O próximo capítulo pode começar com um <span className="text-[#65cbb8]">sim.</span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#bbcbc6]">
              Depoimentos compartilhados por pessoas que passaram pela mentoria ou receberam
              orientações em comunidades. Recolocação, evolução profissional e novas possibilidades.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <p className="mr-2 text-xs font-medium tabular-nums text-white/60" aria-live="polite">
              {String(active + 1).padStart(2, '0')} / {String(HISTORIAS_SOMA.length).padStart(2, '0')}
            </p>
            <button
              type="button"
              onClick={() => move(-1)}
              disabled={!canGoBack}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/25 text-white transition hover:border-[#65cbb8] hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Ver depoimentos anteriores"
            >
              <ChevronLeft size={21} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              disabled={!canGoForward}
              className="grid h-11 w-11 place-items-center rounded-full border border-[#65cbb8]/55 bg-[#0D8071] text-white transition hover:bg-[#0a6d60] disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Ver próximos depoimentos"
            >
              <ChevronRight size={21} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          ref={scroller}
          onScroll={syncActive}
          aria-label="Carrossel de histórias de carreira"
          tabIndex={0}
          className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#65cbb8] sm:mt-7"
        >
          {HISTORIAS_SOMA.map((historia, index) => (
            <article
              data-story-card
              key={index}
              className="flex h-[256px] w-[85%] max-w-[350px] shrink-0 snap-start flex-col justify-between rounded-2xl border border-white/15 bg-[#1c2825] p-4 transition-colors hover:border-[#65cbb8]/65 sm:h-[240px] sm:w-[calc((100%_-_16px)/2)] sm:max-w-none lg:w-[calc((100%_-_48px)/4)]"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-[#0D8071]/25 px-3 py-1.5 text-[11px] font-semibold text-[#8fe1d3]">
                    {historia.categoria}
                  </span>
                  <Quote size={20} className="shrink-0 text-[#65cbb8]/75" aria-hidden="true" />
                </div>
                <blockquote className="mt-3 line-clamp-4 text-sm leading-6 text-[#f3f7f5] sm:line-clamp-5">
                  “{historia.texto}”
                </blockquote>
              </div>
              <div className="mt-3 flex items-center gap-3 border-t border-white/10 pt-3">
                <div aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#65cbb8]/35 bg-[#0D8071]/25 text-xs font-bold tracking-wide text-[#adf1e5]">
                  {historia.iniciais}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{historia.nome}</p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-[#a7bdb5]">{historia.detalhe} · {historia.origem}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

          <p className="mt-3 text-xs leading-5 text-[#a7bdb5]">
            Os cartões mostram um resumo. Os relatos completos e os depoimentos com links originais estão na página de Depoimentos.
          </p>
        <nav aria-label="Depoimentos anteriores publicados no LinkedIn" className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium text-[#a7bdb5]">Relatos publicados no LinkedIn:</span>
          {DEPOIMENTOS_LINKEDIN.map(depoimento => (
            <a
              key={depoimento.nome}
              href={depoimento.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 items-center rounded-full border border-[#65cbb8]/35 bg-[#20332e] px-3 text-xs font-semibold text-[#b8f2e8] transition-colors hover:bg-[#31594d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#65cbb8]"
            >
              {depoimento.nome} <ArrowRight size={13} className="ml-2" aria-hidden="true" />
            </a>
          ))}
        </nav>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-3xl text-xs leading-5 text-[#a7bdb5]">
            Depoimentos reais compartilhados com autorização. Trechos editados apenas para concisão e legibilidade.
            Resultados individuais não representam promessa de aprovação ou contratação.
          </p>
          <Link
            href="/depoimentos"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#8fe1d3] transition hover:text-white"
          >
            Ver depoimentos publicados no LinkedIn <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
