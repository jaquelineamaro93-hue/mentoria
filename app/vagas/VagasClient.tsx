'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { BarChart3, Zap, TrendingUp } from 'lucide-react';
import AnaliseFitTab from './tabs/AnaliseFitTab';
import KanbanTab from './tabs/KanbanTab';
import RankingTab from './tabs/RankingTab';
import type { Profile } from '@/lib/types';

type Tab = 'analise' | 'kanban' | 'ranking';

interface Vaga {
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
  profile: Pick<Profile, 'nome' | 'tipo_pacote' | 'is_admin'> | null;
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
    <div className="flex h-screen bg-gray-50">
      <Sidebar profile={profile} />

      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Controle de Candidaturas</h1>
            <p className="text-gray-600">
              Acompanhe suas candidaturas a vagas de emprego durante sua jornada de transição de carreira
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setTab('analise')}
              className={`py-3 px-4 font-medium text-sm transition border-b-2 ${
                tab === 'analise'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Zap className="w-4 h-4 inline mr-2" />
              Análise de Fit
            </button>

            <button
              onClick={() => setTab('kanban')}
              className={`py-3 px-4 font-medium text-sm transition border-b-2 ${
                tab === 'kanban'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Kanban
            </button>

            <button
              onClick={() => setTab('ranking')}
              className={`py-3 px-4 font-medium text-sm transition border-b-2 ${
                tab === 'ranking'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Ranking
            </button>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="text-gray-600">Carregando vagas...</div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
