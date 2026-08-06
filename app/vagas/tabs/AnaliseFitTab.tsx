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

interface Mensagem {
  tipo: 'sucesso' | 'erro' | 'aviso' | 'erro-acao';
  titulo: string;
  descricao: string;
  acao?: 'meu-perfil' | 'meu-pdi';
}

export default function AnaliseFitTab({ vagas, onVagaAdicionada }: Props) {
  const [vagaInput, setVagaInput] = useState('');
  const [analisando, setAnalisando] = useState(false);
  const [analise, setAnalise] = useState<AnaliseResult | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<Mensagem | null>(null);
  const [gapsResolvidos, setGapsResolvidos] = useState<Set<string>>(new Set());

  async function analisarFit() {
    if (!vagaInput.trim()) {
      setMensagem({
        tipo: 'aviso',
        titulo: 'Cole a vaga primeiro',
        descricao: 'Insira a URL ou a descrição completa da vaga que você quer analisar',
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
          vaga_input: vagaInput,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setAnalise(data);
        setGapsResolvidos(new Set());
      } else {
        setMensagem({
          tipo: data.action ? 'erro-acao' : 'erro',
          titulo: data.error || 'Erro ao analisar',
          descricao: data.hint || 'Tente novamente ou contate o suporte',
          acao: data.action,
        });
      }
    } catch (erro) {
      setMensagem({
        tipo: 'erro',
        titulo: 'Erro ao conectar com a IA',
        descricao: 'Verifique sua conexão com a internet e tente novamente',
      });
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
        setMensagem({
          tipo: 'erro',
          titulo: 'Erro ao criar vaga',
          descricao: 'Não conseguimos salvar a vaga. Tente novamente.',
        });
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
        setMensagem({
          tipo: 'sucesso',
          titulo: '✨ Vaga salva com sucesso!',
          descricao: 'Agora você pode acompanhar seu progresso de preparação na aba "Preparação"',
        });
        setVagaInput('');
        setAnalise(null);
        onVagaAdicionada();
      } else {
        setMensagem({
          tipo: 'aviso',
          titulo: 'Vaga salva, mas houve um pequeno aviso',
          descricao: 'A vaga foi salva, mas tivemos um problema ao gerar o roadmap. Tente novamente.',
        });
        onVagaAdicionada();
      }
    } catch (erro) {
      setMensagem({
        tipo: 'erro',
        titulo: 'Erro ao salvar vaga',
        descricao: 'Houve um erro inesperado. Tente novamente mais tarde.',
      });
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

  const renderMensagem = (msg: Mensagem) => {
    const estilos = {
      sucesso: 'bg-sky-tint border border-sky text-sky-deep',
      erro: 'bg-red-50 border border-red-200 text-red-700',
      aviso: 'bg-yellow-50 border border-yellow-200 text-yellow-700',
      'erro-acao': 'bg-sky-tint border border-sky text-sky-deep',
    };

    const icones = {
      sucesso: <Check className="w-5 h-5 flex-shrink-0" />,
      erro: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
      aviso: <Info className="w-5 h-5 flex-shrink-0" />,
      'erro-acao': <Info className="w-5 h-5 flex-shrink-0" />,
    };

    return (
      <div className={`p-4 rounded-lg flex gap-3 ${estilos[msg.tipo]}`}>
        {icones[msg.tipo]}
        <div className="flex-1">
          <div className="font-medium mb-1">{msg.titulo}</div>
          <p className="text-sm opacity-90 mb-2">{msg.descricao}</p>
          {msg.acao && (
            <Link
              href={msg.acao === 'meu-pdi' ? '/pdi' : '/meu-perfil'}
              className="inline-block text-sm font-medium underline hover:opacity-75 transition"
            >
              {msg.acao === 'meu-pdi' ? 'Ir para Meu PDI' : 'Ir para Meu Perfil'} →
            </Link>
          )}
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
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Cole a URL da Vaga ou Descrição
              </label>
              <textarea
                value={vagaInput}
                onChange={(e) => setVagaInput(e.target.value)}
                placeholder="Cole a URL (LinkedIn, Gupy, etc.) ou a descrição completa da vaga..."
                rows={6}
                className="w-full px-4 py-3 border border-line rounded-lg focus:ring-2 focus:ring-sky-deep focus:border-transparent bg-cream text-ink font-mono text-sm"
              />
            </div>
          </Panel>

          {mensagem && renderMensagem(mensagem)}

          <button
            onClick={analisarFit}
            disabled={analisando || !vagaInput.trim()}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Panel className="p-6 bg-gradient-to-br from-sky-tint to-sky-tint border border-sky">
              <div className="text-sm text-sky-deep mb-2 font-medium">Fit com a Vaga</div>
              <div className="text-4xl font-display text-sky-deep mb-1">
                {analise.fit_score}%
              </div>
              <div className="text-xs text-ink-soft">Compatibilidade Geral</div>
            </Panel>

            <Panel className="p-6 bg-gradient-to-br from-cream to-cream border border-line">
              <div className="text-sm text-brown mb-2 font-medium">Prontidão Atual</div>
              <div className="text-4xl font-display text-brown mb-1">
                {analise.readiness_score}%
              </div>
              <div className="text-xs text-ink-soft">
                +{analise.weeks_to_ready}s para 100% pronto
              </div>
            </Panel>
          </div>

          <Panel className="p-6 border border-sky">
            <p className="text-ink text-center text-sm">{analise.resumo}</p>
          </Panel>

          <div>
            <Eyebrow>Quebra de Scores</Eyebrow>
            <h3 className="font-display text-xl text-brown-deep mb-4">Análise Detalhada</h3>
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
                    ? 'bg-sky-deep'
                    : score >= 50
                      ? 'bg-sky'
                      : 'bg-line';

                return (
                  <Panel key={key} className="p-4 border border-line">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-ink">{label}</span>
                      <span className="text-sm font-bold text-brown-deep">{score}%</span>
                    </div>
                    <div className="w-full bg-cream rounded-full h-2">
                      <div
                        className={`${color} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </Panel>
                );
              })}
            </div>
          </div>

          <div>
            <Eyebrow>
              <Check size={14} />
              Seus Pontos Fortes
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
            <h3 className="font-display text-xl text-brown-deep mb-4">Gaps Identificados</h3>
            <div className="space-y-3">
              {(analise.gaps as Gap[]).map((gap, idx) => {
                const gapKey = typeof gap === 'string' ? gap : gap.titulo;
                const isResolvido = gapsResolvidos.has(gapKey);

                return (
                  <Panel
                    key={idx}
                    className={`p-4 border transition ${
                      isResolvido
                        ? 'bg-sky-tint border-sky'
                        : 'border-line'
                    }`}
                  >
                    {typeof gap === 'string' ? (
                      <div className="text-ink text-sm">• {gap}</div>
                    ) : (
                      <div className="space-y-2">
                        <div className="font-medium text-brown-deep">{gap.titulo}</div>
                        <p className="text-sm text-ink">{gap.descricao}</p>
                        {gap.mitigacao && (
                          <div className="text-sm text-sky-deep bg-sky-tint p-3 rounded border border-sky">
                            💡 <span className="font-medium">Como contornar:</span> {gap.mitigacao}
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleGapResolvido(gapKey)}
                            className={`text-sm px-3 py-1.5 rounded transition font-medium ${
                              isResolvido
                                ? 'bg-sky border border-sky text-sky-deep'
                                : 'bg-cream border border-line text-ink hover:bg-line'
                            }`}
                          >
                            {isResolvido ? '✓ Já possuo' : 'Já possuo'}
                          </button>
                        </div>
                      </div>
                    )}
                  </Panel>
                );
              })}
            </div>
          </div>

          <div>
            <Eyebrow>Currículo</Eyebrow>
            <h3 className="font-display text-xl text-brown-deep mb-4">Recomendações para Currículo</h3>
            <div className="space-y-2">
              {(analise.recomendacoes_curriculo || []).map((rec, idx) => (
                <Panel key={idx} className="p-3 border border-sky bg-sky-tint">
                  <span className="text-ink text-sm">• {rec}</span>
                </Panel>
              ))}
            </div>
          </div>

          {analise.roadmap_items && analise.roadmap_items.length > 0 && (
            <div>
              <Eyebrow>Preparação</Eyebrow>
              <h3 className="font-display text-xl text-brown-deep mb-4">
                Roadmap ({analise.weeks_to_ready} semanas)
              </h3>
              <div className="space-y-2">
                {analise.roadmap_items.slice(0, 3).map((item, idx) => (
                  <Panel
                    key={idx}
                    className="p-4 border border-sky bg-sky-tint"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-brown-deep">{item.titulo}</span>
                      <span className="text-xs px-2 py-1 bg-sky border border-sky-deep text-sky-deep rounded font-medium">
                        {item.semanas}s
                      </span>
                    </div>
                    <p className="text-sm text-ink mb-2">{item.descricao}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ${
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
                  </Panel>
                ))}
                {analise.roadmap_items.length > 3 && (
                  <div className="text-center text-sm text-ink-soft py-3">
                    +{analise.roadmap_items.length - 3} mais items no roadmap completo
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-6">
            <button
              onClick={() => {
                setAnalise(null);
                setVagaInput('');
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
