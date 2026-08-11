'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Passo {
  titulo: string;
  href: string;
  descricao: string;
}

const PASSOS: Passo[] = [
  {
    titulo: 'Início',
    href: '/dashboard',
    descricao:
      'Seu ponto de partida. Aqui ficam os avisos da mentoria, os próximos encontros e os atalhos para o que você usa com mais frequência.',
  },
  {
    titulo: 'Diagnóstico & PDI',
    href: '/pdi',
    descricao:
      'Onde seu plano de desenvolvimento vive. O diagnóstico mapeia onde você está hoje, e o PDI organiza as ações que te levam adiante, com prazos e acompanhamento.',
  },
  {
    titulo: 'Passaporte & Ranking',
    href: '/passaporte',
    descricao:
      'Cada entrega da mentoria vira ponto no seu passaporte. Os pontos abrem recompensas e mostram sua constância junto com a comunidade.',
  },
  {
    titulo: 'Simulador de CV',
    href: '/simulador-cv',
    descricao:
      'Cole seu currículo e a vaga que você quer. O simulador mostra o quanto vocês combinam e o que ajustar no currículo antes de se candidatar.',
  },
  {
    titulo: 'SOAR Builder',
    href: '/entrevista',
    descricao:
      'Transforma sua experiência em respostas prontas de entrevista, escritas em primeira pessoa, para você chegar preparada na conversa.',
  },
  {
    titulo: 'Círculos de Influência',
    href: '/network',
    descricao:
      'Mapeia sua rede em cinco círculos, de quem te conhece de perto a quem você ainda quer alcançar, com um plano de aproximação para cada um.',
  },
];

export default function TourPortal({
  userId,
  aberturaAutomatica,
  aberto,
  onFechar,
}: {
  userId: string;
  aberturaAutomatica: boolean;
  aberto?: boolean;
  onFechar?: () => void;
}) {
  const supabase = createClient();
  const [visivel, setVisivel] = useState(false);
  const [passo, setPasso] = useState(0);

  useEffect(() => {
    if (aberturaAutomatica) setVisivel(true);
  }, [aberturaAutomatica]);

  useEffect(() => {
    if (aberto) {
      setPasso(0);
      setVisivel(true);
    }
  }, [aberto]);

  async function encerrar() {
    setVisivel(false);
    onFechar?.();
    await supabase.from('profiles').update({ tour_concluido: true }).eq('id', userId);
  }

  useEffect(() => {
    if (!visivel) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') encerrar();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [visivel]);

  if (!visivel) return null;

  const atual = PASSOS[passo];
  const ultimo = passo === PASSOS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[60] bg-brown-deep/40 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-titulo"
    >
      <div className="bg-paper border border-line rounded-2xl shadow-lg max-w-lg w-full p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-ink-faint mb-1">
              Conhecendo o portal · {passo + 1} de {PASSOS.length}
            </p>
            <h2 id="tour-titulo" className="font-display text-2xl text-brown-deep">
              {atual.titulo}
            </h2>
          </div>
          <button
            onClick={encerrar}
            className="text-ink-faint hover:text-brown-deep transition shrink-0"
            aria-label="Fechar tour"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-ink-soft leading-relaxed mb-5">{atual.descricao}</p>

        <Link
          href={atual.href}
          onClick={encerrar}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brown-deep border border-line rounded-lg px-3 py-2 hover:bg-cream transition mb-6"
        >
          Ir para {atual.titulo}
          <ArrowRight size={14} />
        </Link>

        <div className="flex items-center gap-1.5 mb-5" aria-hidden="true">
          {PASSOS.map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= passo ? 'bg-brown-deep' : 'bg-line'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={encerrar}
            className="text-sm text-ink-faint hover:text-brown-deep transition"
          >
            Pular tour
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPasso((p) => Math.max(0, p - 1))}
              disabled={passo === 0}
              className="flex items-center gap-1.5 text-sm font-medium text-brown-deep border border-line rounded-lg px-3 py-2 hover:bg-cream transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={14} />
              Voltar
            </button>
            <button
              onClick={() => (ultimo ? encerrar() : setPasso((p) => p + 1))}
              className="flex items-center gap-1.5 text-sm font-medium bg-brown-deep text-paper rounded-lg px-4 py-2 hover:bg-brown transition"
            >
              {ultimo ? (
                <>
                  <Check size={14} />
                  Concluir
                </>
              ) : (
                <>
                  Próximo
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
