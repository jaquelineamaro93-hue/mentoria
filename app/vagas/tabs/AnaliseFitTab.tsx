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

interface AnaliseResult {
  fit_score: number;
  pontos_fortes: string[];
  gaps: string[];
  recomendacoes: string[];
  resumo: string;
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
      const res = await fetch('/api/vagas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa,
          cargo,
          descricao_vaga: descricao,
          fit_score: analise.fit_score,
          etapa: 'para_aplicar',
        }),
      });

      if (res.ok) {
        setMensagem('✅ Vaga criada com sucesso!');
        // Limpar formulário
        setEmpresa('');
        setCargo('');
        setDescricao('');
        setAnalise(null);
        onVagaAdicionada();
      } else {
        setMensagem('Erro ao criar vaga');
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
            mensagem.includes('✅')
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
          {/* Fit Score */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {analise.fit_score}%
              </div>
              <div className="text-gray-700 font-medium">{analise.resumo}</div>
            </div>
          </div>

          {/* Pontos Fortes */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">✅ Seus Pontos Fortes</h3>
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

          {/* Gaps */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">📌 Áreas de Melhoria</h3>
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

          {/* Recomendações */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">💡 Recomendações</h3>
            <ul className="space-y-2">
              {analise.recomendacoes.map((rec, idx) => (
                <li
                  key={idx}
                  className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700"
                >
                  • {rec}
                </li>
              ))}
            </ul>
          </div>

          {/* Ações */}
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
