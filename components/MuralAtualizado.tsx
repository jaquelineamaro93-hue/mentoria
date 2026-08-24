'use client';

import { Users, User as UserIcon, ExternalLink } from 'lucide-react';
import type { Announcement } from '@/lib/types';

interface MuralProps {
  avisos: Announcement[];
}

export default function MuralAtualizado({ avisos }: MuralProps) {
  const avisosPorTipo = {
    gerais: avisos.filter((a) => a.tipo === 'geral').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    individuais: avisos.filter((a) => a.tipo === 'individual').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    grupo: avisos.filter((a) => a.tipo === 'grupo').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  };

  function renderSecao(titulo: string, lista: Announcement[]) {
    if (lista.length === 0) return null;

    return (
      <div key={titulo} className="mb-10">
        <h3 className="text-sm font-medium text-black uppercase tracking-wide mb-4">{titulo}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lista.map((aviso) => (
            <div key={aviso.id} className="bg-white border border-gray-faint rounded-2xl p-5 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`flex items-center gap-1 text-[11px] uppercase tracking-wide px-2.5 py-1 rounded-full border ${
                    aviso.tipo === 'individual'
                      ? 'bg-mint-light border-mint text-black'
                      : aviso.tipo === 'grupo'
                        ? 'bg-mint-light border-mint text-mint'
                        : 'bg-white border-gray-faint text-gray-text'
                  }`}
                >
                  {aviso.tipo === 'individual' ? <UserIcon size={11} /> : aviso.tipo === 'grupo' ? <Users size={11} /> : null}
                  {aviso.tipo === 'individual' ? 'Sessão individual' : aviso.tipo === 'grupo' ? 'Encontro em grupo' : 'Geral'}
                </span>
              </div>
              <p className="text-sm font-medium text-black mb-2">{aviso.titulo}</p>
              {aviso.descricao && (
                <p className="text-xs text-gray-text mb-3 leading-relaxed flex-grow">{aviso.descricao}</p>
              )}
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-faint">
                <span className="text-xs text-gray-text">
                  {new Date(aviso.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
                {aviso.link_url && (
                  <a
                    href={aviso.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-black hover:text-black transition-colors"
                  >
                    Acessar <ExternalLink size={12} />
                  </a>
                )}
              </div>
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
