'use client';

import { useState } from 'react';
import { Zap, Loader, AlertCircle, Check } from 'lucide-react';

interface Vaga {
  id: string;
  empresa: string;
  cargo: string;
  fit_score: number | null;
}

interface Props {
  vagas: Vaga[];
  onVagaAdicionada: () => void;
}

interface SubScores {
  experiencia: number;
  skills_tecnicas: number;
  senioridade: number;
  contexto_setor: number;
}

interface Gap {
  titulo: string;
  descricao: string;
  mitigacao?: string;
  possuiBuscador?: boolean;
}

interface RoadmapItem {
  tipo: 'skill' | 'project' | 'course';
  titulo: string;
  descricao: string;
  semanas: number;
  prioridade: 'high' | 'medium' | 'low';
  recursos: string[];
}

interface AnaliseResult {
  fit_score: number;
  readiness_score: number;
  readiness_gap: number;
  weeks_to_ready: number;
  estimated_readiness_date: string;
  sub_scores: SubScores;
  pontos_fortes: string[];
  gaps: Gap[] | string[];
  recomendacoes_curriculo: string[];
  resumo: string;
  roadmap_items: RoadmapItem[];
  empresa?: string;
  cargo?: string;
}

export default function AnaliseFitTab({ vagas, onVagaAdicionada }: Props) {
  const [vagaInput, setVagaInput] = useState('');
  const [analisando, setAnalisando] = useState(false);
  const [analise, setAnalise] = useState<AnaliseResult | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [gapsResolvidos, setGapsResolvidos] = useState<Set<string>>(new Set());

  async function analisarFit() {
    if (!vagaInput.trim()) {
      setMensagem('Cole a URL ou descrição da vaga');
      return;
    }

    setAnalisando(true);
    setMensagem(null);

    try {
      const res = await fetch('/api/vagas/analisar-fit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vaga_input: vagaInput,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setAnalise(data);
        setGapsResolvidos(new Set());
      } else {
        setMensagem(data.error || 'Erro ao analisar fit');
      }
    } catch (erro) {
      setMensagem('Erro ao conectar com a API');
    } finally {
      setAnalisando(false);
    }
  }

  async function salvarVaga() {
    if (!analise) return;

    setSalvando(true);

    try {
      const empresa = analise.empresa || 'Não identificada';
      const cargo = analise.cargo || 'Cargo não identificado';

      const vagaRes = await fetch('/api/vagas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa,
          cargo,
          descricao_vaga: vagaInput,
          fit_score: analise.fit_score,
          sub_scores: analise.sub_scores,
          pontos_fortes: analise.pontos_fortes,
          gaps: analise.gaps,
          recomendacoes_curriculo: analise.recomendacoes_curriculo,
          etapa: 'para_aplicar',
        }),
      });

      if (!vagaRes.ok) {
        setMensagem('Erro ao criar vaga');
        setSalvando(false);
        return;
      }

      const vagaData = await vagaRes.json();
      const vagaId = vagaData.vaga.id;

      const readinessRes = await fetch('/api/vagas/readiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vaga_id: vagaId,
          readiness_score: analise.readiness_score,
          readiness_gap: analise.readiness_gap,
          weeks_to_ready: analise.weeks_to_ready,
          estimated_readiness_date: analise.estimated_readiness_date,
          roadmap_items: analise.roadmap_items,
        }),
      });

      if (readinessRes.ok) {
        setMensagem('Vaga criada com sucesso!');
        setVagaInput('');
        setAnalise(null);
        onVagaAdicionada();
      } else {
        setMensagem('Vaga criada mas erro ao salvar roadmap');
        onVagaAdicionada();
      }
    } catch (erro) {
      setMensagem('Erro ao salvar vaga');
    } finally {
      setSalvando(false);
    }
  }

  const handleGapResolvido = (gapTitulo: string) => {
    const novo = new Set(gapsResolvidos);
    if (novo.has(gapTitulo)) {
      novo.delete(gapTitulo);
    } else {
      novo.add(gapTitulo);
    }
    setGapsResolvidos(novo);
  };

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-bold mb-6">Analisar Compatibilidade com IA</h2>

      {!analise ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cole a URL da Vaga ou Descrição
            </label>
            <textarea
              value={vagaInput}
              onChange={(e) => setVagaInput(e.target.value)}
              placeholder="Cole a URL (LinkedIn, Gupy, etc.) ou a descrição completa da vaga..."
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          {mensagem && (
            <div
              className={`p-4 rounded-lg flex gap-3 ${
                mensagem.includes('sucesso')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{mensagem}</span>
            </div>
          )}

          <button
            onClick={analisarFit}
            disabled={analisando || !vagaInput.trim()}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
          >
            {analisando ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Analisando com IA...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Analisar Compatibilidade
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <div className="text-sm text-gray-600 mb-2">Fit com a Vaga</div>
              <div className="text-4xl font-bold text-blue-600 mb-1">
                {analise.fit_score}%
              </div>
              <div className="text-xs text-gray-500">Compatibilidade Geral</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
              <div className="text-sm text-gray-600 mb-2">Prontidão Atual</div>
              <div className="text-4xl font-bold text-purple-600 mb-1">
                {analise.readiness_score}%
              </div>
              <div className="text-xs text-gray-500">
                +{analise.weeks_to_ready}w para 100% pronto
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <p className="text-gray-700 text-center">{analise.resumo}</p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Análise Detalhada</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Experiência', key: 'experiencia' as const },
                { label: 'Skills Técnicas', key: 'skills_tecnicas' as const },
                { label: 'Senioridade', key: 'senioridade' as const },
                { label: 'Contexto do Setor', key: 'contexto_setor' as const },
              ].map(({ label, key }) => {
                const score = analise.sub_scores[key];
                const color =
                  score >= 75
                    ? 'bg-green-600'
                    : score >= 50
                      ? 'bg-yellow-600'
                      : 'bg-red-600';

                return (
                  <div key={key} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                      <span className="text-sm font-bold text-gray-900">{score}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`${color} h-3 rounded-full transition-all duration-300`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Seus Pontos Fortes</h3>
            <div className="space-y-2">
              {analise.pontos_fortes.map((ponto, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 flex gap-2"
                >
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{ponto}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Áreas de Melhoria</h3>
            <div className="space-y-3">
              {(analise.gaps as Gap[]).map((gap, idx) => {
                const gapKey = typeof gap === 'string' ? gap : gap.titulo;
                const isResolvido = gapsResolvidos.has(gapKey);

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border transition ${
                      isResolvido
                        ? 'bg-green-50 border-green-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    {typeof gap === 'string' ? (
                      <div className="text-gray-700">• {gap}</div>
                    ) : (
                      <div className="space-y-2">
                        <div className="font-medium text-gray-900">{gap.titulo}</div>
                        <p className="text-sm text-gray-700">{gap.descricao}</p>
                        {gap.mitigacao && (
                          <div className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                            💡 Como contornar: {gap.mitigacao}
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleGapResolvido(gapKey)}
                            className={`text-sm px-3 py-1 rounded transition ${
                              isResolvido
                                ? 'bg-green-200 text-green-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {isResolvido ? '✓ Já possuo' : 'Já possuo'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Recomendações para Currículo</h3>
            <div className="space-y-2">
              {(analise.recomendacoes_curriculo || []).map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700"
                >
                  • {rec}
                </div>
              ))}
            </div>
          </div>

          {analise.roadmap_items && analise.roadmap_items.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Roadmap de Preparação ({analise.weeks_to_ready} semanas)
              </h3>
              <div className="space-y-2">
                {analise.roadmap_items.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-indigo-900">{item.titulo}</span>
                      <span className="text-xs px-2 py-1 bg-indigo-200 text-indigo-700 rounded">
                        {item.semanas}w
                      </span>
                    </div>
                    <p className="text-sm text-indigo-700 mb-1">{item.descricao}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        item.prioridade === 'high'
                          ? 'bg-red-100 text-red-700'
                          : item.prioridade === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {item.prioridade === 'high'
                        ? '🔴 Alta'
                        : item.prioridade === 'medium'
                          ? '🟡 Média'
                          : '🟢 Baixa'}{' '}
                      Prioridade
                    </span>
                  </div>
                ))}
                {analise.roadmap_items.length > 3 && (
                  <div className="text-center text-sm text-gray-600 py-2">
                    +{analise.roadmap_items.length - 3} mais items no roadmap completo
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setAnalise(null);
                setVagaInput('');
              }}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              Analisar Outra Vaga
            </button>
            <button
              onClick={salvarVaga}
              disabled={salvando}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition"
            >
              {salvando ? 'Salvando...' : 'Salvar Vaga'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
