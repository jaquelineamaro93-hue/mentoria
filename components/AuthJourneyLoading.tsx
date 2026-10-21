'use client';

import Link from 'next/link';
import { Compass, ShieldCheck, Sparkles } from 'lucide-react';
import { Mascot } from '@/components/soma/CareerJourney';

type Etapa = 'verificando' | 'preparando' | 'finalizando' | 'erro';
const descricoes: Record<Etapa, { titulo: string; descricao: string }> = {
  verificando: {
    titulo: 'Abrindo sua jornada de carreira',
    descricao: 'Conferindo o acesso ao seu espaço com segurança.',
  },
  preparando: {
    titulo: 'Preparando sua ofensiva de carreira',
    descricao: 'Organizando o caminho para sua próxima conquista.',
  },
  finalizando: {
    titulo: 'Sua jornada está pronta',
    descricao: 'Direcionando você ao seu espaço de desenvolvimento.',
  },
  erro: {
    titulo: 'Não foi possível concluir o acesso',
    descricao: 'O link pode ter expirado ou a conexão foi interrompida.',
  },
};

export default function AuthJourneyLoading({ etapa = 'verificando', detalhe }: {
  etapa?: Etapa;
  detalhe?: string;
}) {
  const atual = descricoes[etapa];
  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-[#101b1b] px-4 py-10 text-white">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-12 h-72 w-72 rounded-full bg-[#0d8071]/15 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#ffb366]/10 blur-3xl" />
      <section className="relative z-10 w-full max-w-md rounded-3xl border border-white/15 bg-white/[0.06] p-6 text-center shadow-2xl backdrop-blur-sm sm:p-9"
        role="status" aria-live="polite" aria-busy={etapa !== 'erro'}>
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-[#76e3ce]/35 bg-[#19312d] sm:h-28 sm:w-28">
          <span className={etapa === 'erro' ? '' : 'motion-safe:animate-[soma-mascote-float_3.8s_ease-in-out_infinite]'} aria-hidden="true">
            <Mascot index={3} size={88} />
          </span>
        </div>
        <div className="mb-3 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.17em] text-[#9be4d6]">
          <Sparkles size={14} aria-hidden="true" /> SOMA · Sua carreira em movimento
        </div>
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">{atual.titulo}</h1>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-white/75">
          {detalhe || atual.descricao}
        </p>
        {etapa !== 'erro' ? (
          <>
            <div className="mx-auto mt-7 flex max-w-xs items-center gap-2" aria-hidden="true">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                <div className="h-full w-1/3 rounded-full bg-[#79dfc7] motion-safe:animate-[soma-loading-stride_1.65s_ease-in-out_infinite] motion-reduce:w-full" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/60">
              <ShieldCheck size={14} aria-hidden="true" /> Protegendo seu acesso
            </div>
          </>
        ) : (
          <Link href="/login" className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#79dfc7] px-6 text-sm font-semibold text-[#10251f] hover:bg-[#b9f2e2]">
            <Compass size={17} aria-hidden="true" /> Voltar ao login
          </Link>
        )}
      </section>
    </main>
  );
}
