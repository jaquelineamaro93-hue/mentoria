'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Announcement } from '@/lib/types';

interface MuralProps {
  avisos: Announcement[];
}

export default function MuralAtualizado({ avisos }: MuralProps) {
  const refGerais = useRef<HTMLDivElement>(null);
  const refIndividuais = useRef<HTMLDivElement>(null);
  const refGrupo = useRef<HTMLDivElement>(null);

  const avisosPorTipo = {
    gerais: avisos.filter((a) => a.tipo === 'geral').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    individuais: avisos.filter((a) => a.tipo === 'individual').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    grupo: avisos.filter((a) => a.tipo === 'grupo').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  };

  function rolarScroll(ref: React.RefObject<HTMLDivElement | null>, direcao: 'esq' | 'dir') {
    if (!ref.current) return;
    const scroll = direcao === 'dir' ? 300 : -300;
    ref.current.scrollBy({ left: scroll, behavior: 'smooth' });
  }

  function renderSecao(titulo: string, lista: Announcement[], ref: React.RefObject<HTMLDivElement | null>) {
    if (lista.length === 0) return null;

    return (
      <div key={titulo} className="mb-8">
        <h3 className="text-sm font-medium text-brown-deep mb-4">{titulo}</h3>
        <div className="relative">
          <div
            ref={ref}
            className="flex gap-4 overflow-x-auto pb-4 scroll-smooth"
            style={{ scrollBehavior: 'smooth' }}
          >
            {lista.map((aviso) => (
              <div
                key={aviso.id}
                className="flex-shrink-0 w-96 bg-white border border-line rounded-2xl p-6"
              >
                <p className="text-xs text-ink-faint mb-3 uppercase tracking-wide">
                  {new Date(aviso.created_at).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-base font-medium text-brown-deep mb-3 line-clamp-2">{aviso.titulo}</p>
                <p className="text-sm text-ink-faint line-clamp-4">{aviso.descricao}</p>
              </div>
            ))}
          </div>
          {lista.length > 2 && (
            <>
              <button
                onClick={() => rolarScroll(ref, 'esq')}
                className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white border border-line rounded-full p-1.5 hover:bg-cream transition-colors"
              >
                <ChevronLeft size={16} className="text-brown-deep" />
              </button>
              <button
                onClick={() => rolarScroll(ref, 'dir')}
                className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white border border-line rounded-full p-1.5 hover:bg-cream transition-colors"
              >
                <ChevronRight size={16} className="text-brown-deep" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {renderSecao('Avisos Gerais', avisosPorTipo.gerais, refGerais)}
      {renderSecao('Sessões Individuais', avisosPorTipo.individuais, refIndividuais)}
      {renderSecao('Avisos do Grupo', avisosPorTipo.grupo, refGrupo)}
    </div>
  );
}
