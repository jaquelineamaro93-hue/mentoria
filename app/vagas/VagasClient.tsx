'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
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
}: {
  profile: Pick<Profile, 'nome' | 'tipo_pacote' | 'is_admin | 'foto_url'> | null;
}) {
  const [tab, setTab] = useState<Tab>('kanban');
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
    <div className="flex h-screen bg-cream">
      <Sidebar profile={profile} />

      <div className="flex-1 overflow-auto">
        <div className="p-8 md:p-12 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Eyebrow>
              <Briefcase size={14} />
              Gestão de Candidaturas
            </Eyebrow>
            <h1 className="font-display text-4xl text-brown-deep mb-2">Controle de Vagas</h1>
            <p className="text-ink-soft text-sm">
              Acompanhe suas candidaturas a vagas de emprego durante sua jornada de transição de carreira
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-line">
            <button
              onClick={() => setTab('analise')}
              className={`py-3 px-4 font-medium text-sm transition border-b-2 flex items-center gap-2 ${
                tab === 'analise'
                  ? 'border-sky-deep text-sky-deep'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              <Zap className="w-4 h-4" />
              Análise de Fit
            </button>

            <button
              onClick={() => setTab('kanban')}
              className={`py-3 px-4 font-medium text-sm transition border-b-2 flex items-center gap-2 ${
                tab === 'kanban'
                  ? 'border-sky-deep text-sky-deep'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Kanban
            </button>

            <button
              onClick={() => setTab('ranking')}
              className={`py-3 px-4 font-medium text-sm transition border-b-2 flex items-center gap-2 ${
                tab === 'ranking'
                  ? 'border-sky-deep text-sky-deep'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Ranking
            </button>
          </div>

          {/* Content */}
          <Panel className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="text-ink-soft">Carregando vagas...</div>
              </div>
            ) : (
              <>
                {tab === 'analise' && (
                  <AnaliseFitTab vagas={vagas} onVagaAdicionada={triggerRefetch} />
                )}
                {tab === 'kanban' && (
                  <KanbanTab vagas={vagas} onVagaAtualizada={triggerRefetch} />
                )}
                {tab === 'ranking' && <RankingTab vagas={vagas} />}
              </>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
