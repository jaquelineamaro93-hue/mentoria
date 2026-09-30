'use client';

import { useState } from 'react';
import { HelpCircle, Paperclip, Target, TrendingUp } from 'lucide-react';
import { PlanoGerado } from '@/components/pdi/PlanoGerado';
import PdiClientContent from './PdiClientContent';
import PdiAcompanhamento from './PdiAcompanhamento';
import PdiEvidenciasClient from './PdiEvidenciasClient';
import type { PdiGuiaSecao, PdiResposta, Profile } from '@/lib/types';

interface MeuPdiClientProps {
  userId: string;
  profile: Profile | null;
  secoes: PdiGuiaSecao[];
  respostasIniciais: PdiResposta[];
}

type Tab = 'perguntas' | 'plano' | 'acompanhamento' | 'evidencias';

const tabs: Array<{
  id: Tab;
  label: string;
  icon: typeof HelpCircle;
}> = [
  { id: 'perguntas', label: 'Perguntas Guia', icon: HelpCircle },
  { id: 'plano', label: 'Plano', icon: Target },
  { id: 'acompanhamento', label: 'Acompanhamento', icon: TrendingUp },
  { id: 'evidencias', label: 'Evidências', icon: Paperclip },
];

export default function MeuPdiClient({
  userId,
  profile,
  secoes,
  respostasIniciais,
}: MeuPdiClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('perguntas');

  return (
    <>
      <div className="border-b border-gray-faint bg-white px-6 md:px-12 py-4 sticky top-0 z-10">
        <div className="flex gap-2 sm:gap-5 overflow-x-auto" role="tablist" aria-label="Plano de desenvolvimento">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const ativa = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={ativa}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'inline-flex items-center gap-2 pb-4 px-2 text-sm font-medium transition-colors whitespace-nowrap',
                  ativa
                    ? 'border-b-2 border-mint-deep text-black'
                    : 'border-b-2 border-transparent text-gray-text hover:text-black',
                ].join(' ')}
              >
                <Icon size={16} strokeWidth={1.6} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 px-6 py-10 md:px-12 w-full">
        {activeTab === 'perguntas' && (
          <PdiClientContent
            profile={profile}
            userId={userId}
            secoes={secoes}
            respostasIniciais={respostasIniciais}
          />
        )}

        {activeTab === 'plano' && <PlanoGerado mentoradoId={userId} />}

        {activeTab === 'acompanhamento' && <PdiAcompanhamento userId={userId} />}

        {activeTab === 'evidencias' && <PdiEvidenciasClient userId={userId} />}
      </main>
    </>
  );
}
