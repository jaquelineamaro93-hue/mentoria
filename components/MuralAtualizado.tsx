'use client';

import type { Announcement } from '@/lib/types';

interface MuralProps {
  avisos: Announcement[];
}

export default function MuralAtualizado({ avisos }: MuralProps) {
  const avisosPorTipo = {
    gerais: avisos
      .filter((a) => a.tipo === 'geral')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    individuais: avisos
      .filter((a) => a.tipo === 'individual')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    grupo: avisos
      .filter((a) => a.tipo === 'grupo')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  };

  function renderSecao(titulo: string, lista: Announcement[]) {
    if (lista.length === 0) return null;

    return (
      <div key={titulo} className="mb-8">
        <h3 className="text-sm font-medium text-brown-deep mb-4">{titulo}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lista.map((aviso) => (
            <div key={aviso.id} className="bg-white border border-line rounded-2xl p-5">
              <p className="text-xs text-ink-faint mb-2 uppercase tracking-wide">
                {new Date(aviso.created_at).toLocaleDateString('pt-BR')}
              </p>
              <p className="text-sm font-medium text-brown-deep mb-2 line-clamp-2">{aviso.titulo}</p>
              <p className="text-xs text-ink-faint line-clamp-5">{aviso.descricao}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {renderSecao('Avisos Gerais', avisosPorTipo.gerais)}
      {renderSecao('Sessões Individuais', avisosPorTipo.individuais)}
      {renderSecao('Avisos do Grupo', avisosPorTipo.grupo)}
    </div>
  );
}
