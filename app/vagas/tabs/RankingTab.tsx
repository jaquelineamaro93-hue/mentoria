'use client';

import { Trophy, Star, TrendingUp } from 'lucide-react';
import { Panel, Eyebrow } from '@/components/Panel';

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
    para_aplicar: 'bg-cream border border-line text-ink',
    aplicada: 'bg-sky-tint border border-sky text-sky-deep',
    entrevista_agendada: 'bg-sky-tint border border-sky text-sky-deep',
    aguardando_retorno: 'bg-sky-tint border border-sky text-sky-deep',
    entrevista_decisor: 'bg-sky-tint border border-sky-deep text-sky-deep',
    case: 'bg-cream border border-brown text-brown',
    oferta: 'bg-sky-tint border border-sky-deep text-sky-deep',
    lost: 'bg-cream border border-line text-ink-faint',
  };
  return cores[etapa] || 'bg-cream border border-line text-ink';
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
      <Eyebrow>
        <TrendingUp size={14} />
        Análise de Oportunidades
      </Eyebrow>
      <h2 className="font-display text-3xl text-brown-deep mb-8">Ranking de Compatibilidade</h2>

      {vagasComFit.length === 0 ? (
        <Panel className="text-center py-12 p-6 border border-line">
          <p className="text-ink">Nenhuma vaga analisada ainda</p>
          <p className="text-sm text-ink-soft mt-2">Use a aba "Análise de Fit" para analisar vagas</p>
        </Panel>
      ) : (
        <div className="space-y-6">
          {/* Top 3 - Destaque */}
          {top3.length > 0 && (
            <div className="mb-8">
              <Eyebrow>
                <Trophy size={14} />
                Melhores Oportunidades
              </Eyebrow>

              <div className="space-y-3">
                {top3.map((vaga, idx) => (
                  <Panel
                    key={vaga.id}
                    className={`relative overflow-hidden p-4 border-2 transition ${
                      idx === 0
                        ? 'bg-sky-tint border-sky-deep'
                        : idx === 1
                          ? 'bg-cream border-brown'
                          : 'bg-sky-tint border-sky'
                    }`}
                  >
                    {/* Posição */}
                    <div
                      className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        idx === 0 ? 'bg-sky-deep' : idx === 1 ? 'bg-brown' : 'bg-sky'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div className="pr-16">
                      {/* Cargo e Empresa */}
                      <div className="mb-3">
                        <p className="font-display text-lg text-brown-deep">{vaga.cargo}</p>
                        <p className="text-ink-soft text-sm">{vaga.empresa}</p>
                      </div>

                      {/* Fit Score */}
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="font-display text-3xl text-sky-deep">
                            {vaga.fit_score}%
                          </div>
                          <div className="text-sm text-ink-soft">de compatibilidade</div>
                        </div>

                        {/* Etapa */}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCorEtapa(vaga.etapa)}`}>
                          {getEtapaLabel(vaga.etapa)}
                        </span>
                      </div>

                      {/* Barra de progresso visual */}
                      <div className="mt-3 h-2 bg-cream rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky to-sky-deep transition-all"
                          style={{ width: `${vaga.fit_score}%` }}
                        />
                      </div>
                    </div>
                  </Panel>
                ))}
              </div>
            </div>
          )}

          {/* Resto das vagas */}
          {resto.length > 0 && (
            <div>
              <Eyebrow>
                <Star size={14} />
                Outras Oportunidades
              </Eyebrow>

              <div className="space-y-2">
                {resto.map((vaga, idx) => (
                  <Panel key={vaga.id} className="flex items-center gap-4 p-4 border border-line hover:border-sky hover:shadow-sm transition">
                    {/* Posição */}
                    <div className="font-medium text-ink-faint w-8 text-center">
                      {idx + 4}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1">
                      <p className="font-medium text-ink">{vaga.cargo}</p>
                      <p className="text-sm text-ink-soft">{vaga.empresa}</p>
                    </div>

                    {/* Fit Score */}
                    <div className="text-right">
                      <p className="font-display text-2xl text-sky-deep">{vaga.fit_score}%</p>
                      <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-semibold ${getCorEtapa(vaga.etapa)}`}>
                        {getEtapaLabel(vaga.etapa)}
                      </span>
                    </div>

                    {/* Barra pequena */}
                    <div className="w-24 h-1 bg-cream rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky transition-all"
                        style={{ width: `${vaga.fit_score}%` }}
                      />
                    </div>
                  </Panel>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Estatísticas */}
      <Panel className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border border-line">
        <div>
          <p className="text-xs text-ink-faint uppercase tracking-wide">Total de Vagas</p>
          <p className="font-display text-3xl text-brown mt-1">{vagas.length}</p>
        </div>
        <div>
          <p className="text-xs text-ink-faint uppercase tracking-wide">Vagas Analisadas</p>
          <p className="font-display text-3xl text-sky-deep mt-1">{vagasComFit.length}</p>
        </div>
        <div>
          <p className="text-xs text-ink-faint uppercase tracking-wide">Fit Médio</p>
          <p className="font-display text-3xl text-sky mt-1">
            {vagasComFit.length > 0
              ? Math.round(
                  vagasComFit.reduce((acc, v) => acc + (v.fit_score || 0), 0) /
                    vagasComFit.length
                )
              : 0}
            %
          </p>
        </div>
      </Panel>
    </div>
  );
}
