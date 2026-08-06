'use client';

import { useState } from 'react';
import { Zap, Loader, AlertCircle, Check, Info, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Panel, Eyebrow } from '@/components/Panel';

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

interface Mensagem {
  tipo: 'sucesso' | 'erro' | 'aviso';
  titulo: string;
  descricao: string;
}

export default function AnaliseFitTab({ vagas, onVagaAdicionada }: Props) {
  const [empresa, setEmpresa] = useState('');
  const [cargo, setCargo] = useState('');
  const [descricao_vaga, setDescricaoVaga] = useState('');
  const [analisando, setAnalisando] = useState(false);
  const [analise, setAnalise] = useState<AnaliseResult | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<Mensagem | null>(null);

  async function analisarFit() {
    if (!empresa.trim() || !cargo.trim() || !descricao_vaga.trim()) {
      setMensagem({
        tipo: 'aviso',
        titulo: 'Preencha todos os campos',
        descricao: 'Empresa, cargo e descrição são obrigatórios',
      });
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
          descricao_vaga,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setAnalise(data);
      } else {
        setMensagem({
          tipo: 'erro',
          titulo: data.error || 'Erro ao analisar',
          descricao: 'Tente novamente ou contate o suporte',
        });
      }
    } catch (erro) {
      setMensagem({
        tipo: 'erro',
        titulo: 'Erro ao conectar',
        descricao: 'Verifique sua conexão e tente novamente',
      });
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
          descricao_vaga,
          fit_score: analise.fit_score,
          pontos_fortes: analise.pontos_fortes,
          gaps: analise.gaps,
          recomendacoes_curriculo: analise.recomendacoes,
          etapa: 'para_aplicar',
        }),
      });

      if (vagaRes.ok) {
        setMensagem({
          tipo: 'sucesso',
          titulo: '✨ Vaga salva com sucesso!',
          descricao: 'Agora você pode acompanhar seu progresso no Kanban',
        });
        setEmpresa('');
        setCargo('');
        setDescricaoVaga('');
        setAnalise(null);
        onVagaAdicionada();
      } else {
        setMensagem({
          tipo: 'erro',
          titulo: 'Erro ao salvar vaga',
          descricao: 'Tente novamente',
        });
      }
    } catch (erro) {
      setMensagem({
        tipo: 'erro',
        titulo: 'Erro ao salvar',
        descricao: 'Houve um erro inesperado',
      });
    } finally {
      setSalvando(false);
    }
  }

  const renderMensagem = (msg: Mensagem) => {
    const estilos = {
      sucesso: 'bg-sky-tint border border-sky text-sky-deep',
      erro: 'bg-red-50 border border-red-200 text-red-700',
      aviso: 'bg-yellow-50 border border-yellow-200 text-yellow-700',
    };

    const icones = {
      sucesso: <Check className="w-5 h-5 flex-shrink-0" />,
      erro: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
      aviso: <Info className="w-5 h-5 flex-shrink-0" />,
    };

    return (
      <div className={`p-4 rounded-lg flex gap-3 ${estilos[msg.tipo]}`}>
        {icones[msg.tipo]}
        <div className="flex-1">
          <div className="font-medium mb-1">{msg.titulo}</div>
          <p className="text-sm opacity-90">{msg.descricao}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl">
      <Eyebrow>
        <Sparkles size={14} />
        Análise de Fit
      </Eyebrow>
      <h2 className="font-display text-3xl text-brown-deep mb-8">Compatibilidade com Vaga</h2>

      {!analise ? (
        <div className="space-y-4">
          <Panel className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Empresa</label>
                <input
                  type="text"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  placeholder="Ex: Nubank, Google, Uber"
                  className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-sky-deep focus:border-transparent bg-cream text-ink"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Cargo</label>
                <input
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ex: Analista de Marketing"
                  className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-sky-deep focus:border-transparent bg-cream text-ink"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Descrição da Vaga</label>
              <textarea
                value={descricao_vaga}
                onChange={(e) => setDescricaoVaga(e.target.value)}
                placeholder="Cole aqui a descrição completa da vaga..."
                rows={6}
                className="w-full px-4 py-3 border border-line rounded-lg focus:ring-2 focus:ring-sky-deep focus:border-transparent bg-cream text-ink font-mono text-sm"
              />
            </div>
          </Panel>

          {mensagem && renderMensagem(mensagem)}

          <button
            onClick={analisarFit}
            disabled={analisando || !empresa.trim() || !cargo.trim() || !descricao_vaga.trim()}
            className="w-full bg-brown hover:bg-brown-deep disabled:opacity-50 text-paper py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition"
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
          {mensagem && renderMensagem(mensagem)}

          <Panel className="p-6 bg-sky-tint border border-sky">
            <div className="text-sm text-sky-deep mb-2 font-medium">Compatibilidade</div>
            <div className="text-4xl font-display text-sky-deep mb-2">{analise.fit_score}%</div>
            <p className="text-ink text-sm">{analise.resumo}</p>
          </Panel>

          <div>
            <Eyebrow>
              <Check size={14} />
              Pontos Fortes
            </Eyebrow>
            <div className="space-y-2">
              {analise.pontos_fortes.map((ponto, idx) => (
                <Panel key={idx} className="p-3 border border-sky bg-sky-tint flex gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5 text-sky-deep" />
                  <span className="text-ink text-sm">{ponto}</span>
                </Panel>
              ))}
            </div>
          </div>

          <div>
            <Eyebrow>Áreas de Desenvolvimento</Eyebrow>
            <div className="space-y-2">
              {analise.gaps.map((gap, idx) => (
                <Panel key={idx} className="p-3 border border-line">
                  <span className="text-ink text-sm">• {gap}</span>
                </Panel>
              ))}
            </div>
          </div>

          <div>
            <Eyebrow>Recomendações para Currículo</Eyebrow>
            <div className="space-y-2">
              {analise.recomendacoes.map((rec, idx) => (
                <Panel key={idx} className="p-3 border border-sky bg-sky-tint">
                  <span className="text-ink text-sm">• {rec}</span>
                </Panel>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              onClick={() => {
                setAnalise(null);
                setEmpresa('');
                setCargo('');
                setDescricaoVaga('');
                setMensagem(null);
              }}
              className="flex-1 bg-cream border border-line text-ink py-2.5 rounded-lg font-medium hover:bg-line transition"
            >
              Analisar Outra Vaga
            </button>
            <button
              onClick={salvarVaga}
              disabled={salvando}
              className="flex-1 bg-brown hover:bg-brown-deep disabled:opacity-50 text-paper py-2.5 rounded-lg font-medium transition"
            >
              {salvando ? 'Salvando...' : '✨ Salvar Vaga'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
