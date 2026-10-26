'use client';
import LocalizedText from '@/components/LocalizedText';

import { useState, useEffect } from 'react';
import { BarChart3, Zap, TrendingUp, Briefcase } from 'lucide-react';
import { Panel, Eyebrow } from '@/components/Panel';
import AnaliseFitTab from './tabs/AnaliseFitTab';
import KanbanTab from './tabs/KanbanTab';
import RankingTab from './tabs/RankingTab';
import type { Profile } from '@/lib/types';

type Tab = 'analise' | 'kanban' | 'ranking';

interface Vaga {
  origem?: string;
  contato: string | null;
  id: string;
  empresa: string;
  cargo: string;
  etapa: string;
  fit_score: number | null;
  descricao_vaga: string | null;
  link_vaga: string | null;
  proximo_passo: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export default function VagasClient({
  profile,
  embedded = false,
}: {
  profile: Pick<Profile, 'nome' | 'tipo_pacote' | 'is_admin' | 'foto_url'> | null;
  embedded?: boolean;
}) {
  const [tab, setTab] = useState<Tab>(embedded ? 'analise' : 'kanban');
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetch, setRefetch] = useState(0);

  useEffect(() => {
    carregarVagas();
  }, [refetch]);

  async function carregarVagas() {
    setLoading(true);
    try {
      const res = await fetch('/api/vagas');
      const data = await res.json();
      if (data.vagas) {
        setVagas(data.vagas);
      }
    } catch (erro) {
      console.error('Erro ao carregar vagas:', erro);
    } finally {
      setLoading(false);
    }
  }

  const triggerRefetch = () => {
    setRefetch((prev) => prev + 1);
  };

  return (
    <>
      <div className={embedded ? '' : 'px-4 py-6 sm:px-6 lg:px-8 lg:py-8'}>
          {!embedded && (
            <div className="mb-5">
              <Eyebrow>
                <Briefcase size={14} /><LocalizedText text={"Gestão de candidaturas"} /></Eyebrow>
              <h1 className="font-display text-3xl md:text-4xl text-black mb-2"><LocalizedText text={"Controle de vagas"} /></h1>
              <p className="text-gray-text text-sm"><LocalizedText text={"Acompanhe suas candidaturas durante sua jornada de carreira."} /></p>
            </div>
          )}

          {/* Tabs */}
          <div role="tablist" aria-label="Etapas da gestão de candidaturas" className="flex gap-1 mb-5 overflow-x-auto rounded-2xl border border-gray-faint bg-white p-1.5">
            <button
              onClick={() => setTab('analise')}
              role="tab"
              aria-selected={tab === 'analise'} 
              className={`shrink-0 rounded-xl px-3.5 py-2.5 font-medium text-sm transition flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-deep ${
                tab === 'analise'
                  ? 'bg-mint-light text-black shadow-sm'
                  : 'text-gray-text hover:bg-gray-50 hover:text-black'
              }`}
            >
              <Zap className="w-4 h-4" /><LocalizedText text={"Análise de Fit"} /></button>

            <button
              onClick={() => setTab('kanban')}
              role="tab"
              aria-selected={tab === 'kanban'} 
              className={`shrink-0 rounded-xl px-3.5 py-2.5 font-medium text-sm transition flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-deep ${
                tab === 'kanban'
                  ? 'bg-mint-light text-black shadow-sm'
                  : 'text-gray-text hover:bg-gray-50 hover:text-black'
              }`}
            >
              <BarChart3 className="w-4 h-4" /><LocalizedText text={"Kanban"} /></button>

            <button
              onClick={() => setTab('ranking')}
              role="tab"
              aria-selected={tab === 'ranking'} 
              className={`shrink-0 rounded-xl px-3.5 py-2.5 font-medium text-sm transition flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-deep ${
                tab === 'ranking'
                  ? 'bg-mint-light text-black shadow-sm'
                  : 'text-gray-text hover:bg-gray-50 hover:text-black'
              }`}
            >
              <TrendingUp className="w-4 h-4" /><LocalizedText text={"Ranking"} /></button>
          </div>

          {/* Content */}
          <Panel className="p-4 sm:p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="text-gray-text"><LocalizedText text={"Carregando vagas..."} /></div>
              </div>
            ) : (
              <>
                {tab === 'analise' && (
                  <AnaliseFitTab vagas={vagas} onVagaAdicionada={triggerRefetch} />
                )}
                {tab === 'kanban' && (
                  <KanbanTab vagas={vagas} onVagaAtualizada={triggerRefetch} />
                )}
                {tab === 'ranking' && <RankingTab vagas={vagas} onAnalisar={() => setTab('analise')} />}
              </>
            )}
          </Panel>
        </div>
    </>
  );
}
