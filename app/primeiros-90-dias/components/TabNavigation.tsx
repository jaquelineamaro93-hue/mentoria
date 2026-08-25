'use client';

interface TabNavigationProps {
  activeTab: 'overview' | 'month1' | 'month2' | 'month3';
  onTabChange: (tab: 'overview' | 'month1' | 'month2' | 'month3') => void;
}

const TABS = [
  {
    id: 'overview',
    label: 'Visão Geral',
    subtitle: 'Dashboard & Insights',
    title: 'Acompanhamento e Inteligência',
  },
  {
    id: 'month1',
    label: 'Mês 1',
    subtitle: 'Dias 1 a 30',
    title: 'Diagnóstico e Credibilidade',
  },
  {
    id: 'month2',
    label: 'Mês 2',
    subtitle: 'Dias 31 a 60',
    title: 'Alinhamento e Entregas Rápidas',
  },
  {
    id: 'month3',
    label: 'Mês 3',
    subtitle: 'Dias 61 a 90',
    title: 'Estrutura e Visão de Longo Prazo',
  },
];

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex gap-4 border-b border-gray-faint pb-6 overflow-x-auto">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id as 'overview' | 'month1' | 'month2' | 'month3')}
          className={`py-3 px-6 rounded-t-lg border-b-2 transition-colors shrink-0 ${
            activeTab === tab.id
              ? 'border-mint text-black font-medium'
              : 'border-transparent text-gray-text hover:text-black'
          }`}
        >
          <div className="text-sm font-medium">{tab.label}</div>
          <div className="text-xs text-gray-text">{tab.subtitle}</div>
        </button>
      ))}
    </div>
  );
}
