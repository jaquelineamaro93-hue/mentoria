'use client';

import { useState } from 'react';
import { Zap, Loader } from 'lucide-react';

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
  gaps: string[];
  recomendacoes_curriculo: string[];
  resumo: string;
  roadmap_items: RoadmapItem[];
}

export default function AnaliseFitTab({ vagas, onVagaAdicionada }: Props) {
  const [empresa, setEmpresa] = useState('');
  const [cargo, setCargo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [analisando, setAnalisando] = useState(false);
  const [analise, setAnalise] = useState<AnaliseResult | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function analisarFit() {
    if (!empresa || !cargo || !descricao) {
      setMensagem('Preencha empresa, cargo e descrição da vaga');
      return;
    }

    setAnalisando(true);
    setMensagem(null);

    try {
      const res = await fetch('/api/vagas/analisar-fit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa,
          cargo,
          descricao_vaga: descricao,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setAnalise(data);
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
      const vagaRes = await fetch('/api/vagas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa,
          cargo,
          descricao_vaga: descricao,
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
        setEmpresa('');
        setCargo('');
        setDescricao('');
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

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-bold mb-6">Analisar Compatibilidade com IA</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Empresa
          </label>
          <input
            type="text"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            placeholder="Ex: Nubank, Google, Uber"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cargo
          </label>
          <input
            type="text"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            placeholder="Ex: Analista de Marketing"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição da Vaga
        </label>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Cole aqui a descrição completa da vaga..."
          rows={8}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
        />
      </div>

      {mensagem && (
        <div
          className={`p-4 mb-6 rounded-lg ${
            mensagem.includes('sucesso')
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {mensagem}
        </div>
      )}

      {!analise ? (
        <button
          onClick={analisarFit}
          disabled={analisando || !empresa || !cargo || !descricao}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
        >
          {analisando ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Analisando fit com IA...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Analisar Compatibilidade
            </>
          )}
        </button>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">Compatibilidade com Vaga</div>
                <div className="text-4xl font-bold text-blue-600 mb-1">
                  {analise.fit_score}%
                </div>
                <div className="text-xs text-gray-500">Fit Score</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">Prontidão Atual</div>
                <div className="text-4xl font-bold text-purple-600 mb-1">
                  {analise.readiness_score}%
                </div>
                <div className="text-xs text-gray-500">
                  +{analise.weeks_to_ready}w até 100%
                </div>
              </div>
            </div>
          </div>

          <div className="text-center text-gray-700 font-medium text-lg">
            {analise.resumo}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Experiência', key: 'experiencia' as const },
              { label: 'Skills Técnicas', key: 'skills_tecnicas' as const },
              { label: 'Senioridade', key: 'senioridade' as const },
              { label: 'Contexto do Setor', key: 'contexto_setor' as const },
            ].map(({ label, key }) => (
              <div key={key} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                  <span className="text-sm font-bold text-gray-900">{analise.sub_scores[key]}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${analise.sub_scores[key]}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Seus Pontos Fortes</h3>
            <ul className="space-y-2">
              {analise.pontos_fortes.map((ponto, idx) => (
                <li
                  key={idx}
                  className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700"
                >
                  • {ponto}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Áreas de Melhoria</h3>
            <ul className="space-y-2">
              {analise.gaps.map((gap, idx) => (
                <li
                  key={idx}
                  className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700"
                >
                  • {gap}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Recomendações para Currículo</h3>
            <ul className="space-y-2">
              {(analise.recomendacoes_curriculo || []).map((rec, idx) => (
                <li
                  key={idx}
                  className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700"
                >
                  • {rec}
                </li>
              ))}
            </ul>
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
              onClick={() => setAnalise(null)}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400 transition"
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
