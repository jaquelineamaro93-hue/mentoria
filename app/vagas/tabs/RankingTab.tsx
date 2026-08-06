'use client';

import { Trophy, Star } from 'lucide-react';

interface Vaga {
  id: string;
  empresa: string;
  cargo: string;
  fit_score: number | null;
  etapa: string;
}

interface Props {
  vagas: Vaga[];
}

const getCorEtapa = (etapa: string): string => {
  const cores: Record<string, string> = {
    para_aplicar: 'bg-red-100 text-red-700',
    aplicada: 'bg-orange-100 text-orange-700',
    entrevista_agendada: 'bg-yellow-100 text-yellow-700',
    aguardando_retorno: 'bg-blue-100 text-blue-700',
    entrevista_decisor: 'bg-purple-100 text-purple-700',
    case: 'bg-pink-100 text-pink-700',
    oferta: 'bg-green-100 text-green-700',
    lost: 'bg-gray-100 text-gray-700',
  };
  return cores[etapa] || 'bg-gray-100 text-gray-700';
};

const getEtapaLabel = (etapa: string): string => {
  const labels: Record<string, string> = {
    para_aplicar: 'Para Aplicar',
    aplicada: 'Aplicada',
    entrevista_agendada: 'Entrevista Agendada',
    aguardando_retorno: 'Aguardando Retorno',
    entrevista_decisor: 'Entrevista c/ Decisor',
    case: 'Case',
    oferta: 'Oferta',
    lost: 'Lost',
  };
  return labels[etapa] || etapa;
};

export default function RankingTab({ vagas }: Props) {
  // Filtrar vagas com fit_score e ordenar
  const vagasComFit = vagas
    .filter((v) => v.fit_score !== null)
    .sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0));

  const top3 = vagasComFit.slice(0, 3);
  const resto = vagasComFit.slice(3);

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Ranking de Compatibilidade</h2>

      {vagasComFit.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <p>Nenhuma vaga analisada ainda</p>
          <p className="text-sm mt-2">Use a aba "Análise de Fit" para analisar vagas</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top 3 - Destaque */}
          {top3.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Melhores Oportunidades
              </h3>

              <div className="space-y-3">
                {top3.map((vaga, idx) => (
                  <div
                    key={vaga.id}
                    className={`relative overflow-hidden rounded-lg p-4 border-2 transition ${
                      idx === 0
                        ? 'bg-yellow-50 border-yellow-300'
                        : idx === 1
                          ? 'bg-gray-100 border-gray-300'
                          : 'bg-orange-50 border-orange-300'
                    }`}
                  >
                    {/* Posição */}
                    <div
                      className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : 'bg-orange-500'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div className="pr-16">
                      {/* Cargo e Empresa */}
                      <div className="mb-3">
                        <p className="text-lg font-bold text-gray-900">{vaga.cargo}</p>
                        <p className="text-gray-600">{vaga.empresa}</p>
                      </div>

                      {/* Fit Score */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="text-3xl font-bold text-blue-600">
                            {vaga.fit_score}%
                          </div>
                          <div className="text-sm text-gray-600">de compatibilidade</div>
                        </div>

                        {/* Etapa */}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCorEtapa(vaga.etapa)}`}>
                          {getEtapaLabel(vaga.etapa)}
                        </span>
                      </div>

                      {/* Barra de progresso visual */}
                      <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                          style={{ width: `${vaga.fit_score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resto das vagas */}
          {resto.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-blue-500" />
                Outras Oportunidades
              </h3>

              <div className="space-y-2">
                {resto.map((vaga, idx) => (
                  <div key={vaga.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition">
                    {/* Posição */}
                    <div className="text-xl font-bold text-gray-400 w-8 text-center">
                      {idx + 4}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{vaga.cargo}</p>
                      <p className="text-sm text-gray-600">{vaga.empresa}</p>
                    </div>

                    {/* Fit Score */}
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{vaga.fit_score}%</p>
                      <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${getCorEtapa(vaga.etapa)}`}>
                        {getEtapaLabel(vaga.etapa)}
                      </span>
                    </div>

                    {/* Barra pequena */}
                    <div className="w-24 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${vaga.fit_score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Estatísticas */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <p className="text-sm text-gray-600">Total de Vagas</p>
          <p className="text-2xl font-bold text-gray-900">{vagas.length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Vagas Analisadas</p>
          <p className="text-2xl font-bold text-gray-900">{vagasComFit.length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Fit Médio</p>
          <p className="text-2xl font-bold text-gray-900">
            {vagasComFit.length > 0
              ? Math.round(
                  vagasComFit.reduce((acc, v) => acc + (v.fit_score || 0), 0) /
                    vagasComFit.length
                )
              : 0}
            %
          </p>
        </div>
      </div>
    </div>
  );
}
