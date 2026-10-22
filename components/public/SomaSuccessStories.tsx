'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

/**
 * Excertos fiéis de mensagens recebidas pela mentora e apresentadas pela
 * titular da SOMA. Não identificar participantes por nome/foto/telefone sem
 * autorização específica para uso publicitário.
 *
 * Evitar contagens de contratações, avaliações 5 estrelas inventadas e
 * atribuição à plataforma SOMA de resultados que surgiram em mentorias ou
 * na comunidade anteriores ao produto.
 */
export const HISTORIAS_SOMA = [
  {
    categoria: 'Currículo e Gupy',
    texto: 'Passei no processo seletivo, depois de 2 meses buscando emprego. Venci a Gupy.',
    detalhe: 'Relato de aprovação em processo seletivo',
  },
  {
    categoria: 'LinkedIn e currículo',
    texto: 'Finalmente meu “SIM” chegou, e tudo graças às mudanças que fiz no LinkedIn e no currículo.',
    detalhe: 'Relato de recolocação',
  },
  {
    categoria: 'Gupy e carreira',
    texto: 'Venci a Gupy e me recoloquei.',
    detalhe: 'Relato de recolocação',
  },
  {
    categoria: 'LinkedIn',
    texto: 'Depois de reestruturar melhor meu perfil do LinkedIn e ser mais ativo, consegui me recolocar de volta no mercado.',
    detalhe: 'Relato de recolocação',
  },
  {
    categoria: 'Currículo e Gupy',
    texto: 'Venciiii tbm a Gupyyyyy e sou Analista de Dados.',
    detalhe: 'Relato de contratação',
  },
  {
    categoria: 'Mentoria e entrevistas',
    texto: 'Com uma metodologia simples e assertiva, minha performance nas entrevistas evoluiu consideravelmente.',
    detalhe: 'Relato de evolução em entrevistas',
  },
  {
    categoria: 'Mercado de trabalho',
    texto: 'Consegui um emprego na área que gostaria, agradeço todo o seu apoio.',
    detalhe: 'Relato de contratação',
  },
  {
    categoria: 'Currículo e carreira',
    texto: 'Depois de algumas entrevistas consegui minha transição. Venci a Gupy.',
    detalhe: 'Relato de transição profissional',
  },
  {
    categoria: 'Evolução profissional',
    texto: 'Meu SIM acabou de chegar. Estou de volta no mercado de trabalho.',
    detalhe: 'Relato de recolocação',
  },
  {
    categoria: 'Mentoria de carreira',
    texto: 'Deu certo a vaga de CX Lead. Aprovado para analista e CX Lead, e nem terminei todos os passos da mentoria.',
    detalhe: 'Relato de aprovação',
  },
  {
    categoria: 'Gupy e tecnologia',
    texto: 'Fui aprovado no processo seletivo da Gupy, mas desta vez para uma posição em Desenvolvimento de Software.',
    detalhe: 'Relato de aprovação',
  },
  {
    categoria: 'LinkedIn e oportunidades',
    texto: 'Devido ao meu LinkedIn formatado e meu selo #OpenToWork, consegui fechar um contrato para configuração de uma Sales Cloud.',
    detalhe: 'Relato de oportunidade profissional',
  },
  {
    categoria: 'Acompanhamento',
    texto: 'Comecei essa semana em um novo emprego. Valeu pela parceria.',
    detalhe: 'Relato de recolocação',
  },
  {
    categoria: 'LinkedIn e recolocação',
    texto: 'Segui tudo direitinho e consegui meu novo emprego. Muito obrigada de coração.',
    detalhe: 'Relato de contratação',
  },
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
      className="overflow-hidden bg-[#111b19] py-14 text-white sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#4ac1ae]/30 bg-[#0D8071]/20 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#8fe1d3]">
              <Quote size={15} aria-hidden="true" />
              Histórias recebidas, resultados reais
            </p>
            <h2 id="historias-soma-titulo" className="font-display text-3xl leading-tight sm:text-4xl lg:text-5xl">
              O próximo capítulo pode começar com um <span className="text-[#65cbb8]">sim.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#bbcbc6] sm:text-base">
              Mensagens de pessoas que receberam orientações em mentorias e comunidades.
              Histórias de recolocação, avanço em processos seletivos e novas possibilidades.
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
          className="mt-9 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#65cbb8] sm:mt-10"
        >
          {HISTORIAS_SOMA.map((historia, index) => (
            <article
              data-story-card
              key={index}
              className="flex min-h-[290px] w-[85%] max-w-[350px] shrink-0 snap-start flex-col justify-between rounded-2xl border border-white/15 bg-[#1c2825] p-5 transition-colors hover:border-[#65cbb8]/65 sm:w-[calc((100%_-_16px)/2)] sm:max-w-none sm:p-6 lg:w-[calc((100%_-_48px)/4)]"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-[#0D8071]/25 px-3 py-1.5 text-[11px] font-semibold text-[#8fe1d3]">
                    {historia.categoria}
                  </span>
                  <Quote size={20} className="shrink-0 text-[#65cbb8]/75" aria-hidden="true" />
                </div>
                <blockquote className="mt-5 text-sm leading-7 text-[#f3f7f5] sm:text-[15px]">
                  “{historia.texto}”
                </blockquote>
              </div>
              <div className="mt-8 border-t border-white/10 pt-4">
                <p className="text-sm font-semibold text-white">{historia.detalhe}</p>
                <p className="mt-1 text-xs text-[#a7bdb5]">Nome preservado por privacidade</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-3xl text-xs leading-5 text-[#a7bdb5]">
            Trechos selecionados de mensagens recebidas, com edição leve para leitura e identificação omitida. Experiências individuais,
            sem promessa de aprovação ou contratação.
          </p>
          <Link
            href="/depoimentos"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#8fe1d3] transition hover:text-white"
          >
            Conhecer mais histórias <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
