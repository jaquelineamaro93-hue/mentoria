'use client';

import { ChevronRight } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const SIDEBAR_ITEMS = [
  {
    title: 'Estrutura dos 90 Dias',
    description: 'Entenda a progressão de cada mês',
  },
  {
    title: 'Contexto STARS',
    description: 'Saiba como seu contexto afeta a estratégia',
  },
  {
    title: 'Próximos Passos',
    description: 'Veja o que fazer após completar',
  },
  {
    title: 'Materiais de Suporte',
    description: 'Acesse templates e guias',
  },
];

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  return (
    <>
      {/* Sidebar Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed left-6 top-40 z-40 p-2 rounded-lg bg-white border border-gray-faint hover:border-gray-text transition-all md:hidden"
        aria-label="Toggle sidebar"
      >
        <ChevronRight
          size={20}
          className={`text-gray-text transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Sidebar Overlay (Mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gray-light border-r border-gray-faint p-6 z-40 transform transition-transform duration-300 md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between md:hidden">
            <h3 className="font-display text-lg text-black">Menu</h3>
            <button
              onClick={onToggle}
              className="p-1 hover:bg-gray-faint rounded transition-colors"
            >
              <ChevronRight size={20} className="text-gray-text rotate-180" />
            </button>
          </div>

          <nav className="space-y-4 hidden md:block">
            <h3 className="text-xs font-medium text-gray-text uppercase tracking-wider">
              Navegação
            </h3>
            <div className="space-y-2">
              {SIDEBAR_ITEMS.map((item, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-white border border-gray-faint hover:border-gray-text transition-all cursor-pointer group"
                >
                  <h4 className="text-sm font-medium text-black group-hover:text-gray-text transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-text mt-1">{item.description}</p>
                </div>
              ))}
            </div>
          </nav>

          <div className="md:hidden space-y-2">
            {SIDEBAR_ITEMS.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-white border border-gray-faint hover:border-gray-text transition-all cursor-pointer group"
              >
                <h4 className="text-sm font-medium text-black group-hover:text-gray-text transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-text mt-1">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-gray-faint">
            <div className="p-4 rounded-lg bg-white border border-mint-border">
              <p className="text-xs font-medium text-black mb-2">Dica Rápida</p>
              <p className="text-xs text-gray-text leading-relaxed">
                Preencha cada seção com cuidado. Seus dados ajudam a personalizar sua mentoria.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
