'use client';

import { useState } from 'react';
import { AlertCircle, Check, Compass, FileSearch, Loader, Sparkles } from 'lucide-react';
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
  breakdown_por_categoria: {
    experiencia: number;
    skills_tecnicas: number;
    senioridade: number;
    contexto_setor: number;
  };
  pontos_fortes: string[];
  gaps: string[];
  recomendacoes: string[];
  palavras_chave_ats: string[];
  resumo: string;
  contexto_soma?: string;
  source_cv_simulacao_id?: string | null;
}

interface Mensagem {
  tipo: 'sucesso' | 'erro' | 'aviso';
  titulo: string;
  descricao: string;
}

export default function AnaliseFitTab({ vagas, onVagaAdicionada }: Props) {
  const [empresa, setEmpresa] = useState('');
  const [cargo, setCargo] = useState('');
  const [descricaoVaga, setDescricaoVaga] = useState('');
  const [analisando, setAnalisando] = useState(false);
  const [analise, setAnalise] = useState<AnaliseResult | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<Mensagem | null>(null);

  async function analisarFit() {
    if (!empresa.trim() || !cargo.trim() || !descricaoVaga.trim()) {
      setMensagem({
        tipo: 'aviso',
        titulo: 'Preencha os dados da vaga',
        descricao: 'Empresa, cargo e descrição são obrigatórios para comparar a oportunidade com sua jornada.',
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
          descricao_vaga: descricaoVaga,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setAnalise(data);
      } else if (data.errorCode === 'MISSING_CV_BASE') {
        setMensagem({
          tipo: 'aviso',
          titulo: 'Seu currículo ainda não está conectado à jornada',
          descricao: data.error,
        });
      } else {
        setMensagem({
          tipo: 'erro',
          titulo: data.error || 'Erro ao analisar',
          descricao: 'Tente novamente. Se o erro persistir, fale com o suporte da mentoria.',
        });
      }
    } catch {
      setMensagem({
        tipo: 'erro',
        titulo: 'Erro ao conectar',
        descricao: 'Verifique sua conexão e tente novamente.',
      });
    } finally {
      setAnalisando(false);
    }
  }

  async function salvarVaga() {
    if (!analise) return;

    setSalvando(true);
    setMensagem(null);

    try {
      const vagaRes = await fetch('/api/vagas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa,
          cargo,
          descricao_vaga: descricaoVaga,
          fit_score: analise.fit_score,
          sub_scores: analise.breakdown_por_categoria,
          pontos_fortes: analise.pontos_fortes,
          gaps: analise.gaps,
          recomendacoes_curriculo: analise.recomendacoes,
          resumo: analise.resumo,
          cv_simulacao_id: analise.source_cv_simulacao_id ?? null,
          etapa: 'para_aplicar',
        }),
      });

      if (vagaRes.ok) {
        setMensagem({
          tipo: 'sucesso',
          titulo: 'Vaga salva na sua jornada',
          descricao: 'Ela já está no Kanban com o resultado desta análise para você acompanhar a evolução.',
        });
        setEmpresa('');
        setCargo('');
        setDescricaoVaga('');
        setAnalise(null);
        onVagaAdicionada();
      } else {
        const data = await vagaRes.json();
        setMensagem({
          tipo: 'erro',
          titulo: 'Erro ao salvar vaga',
          descricao: data.error || 'Tente novamente.',
        });
      }
    } catch {
      setMensagem({
        tipo: 'erro',
        titulo: 'Erro ao salvar',
        descricao: 'Houve um erro inesperado.',
      });
    } finally {
      setSalvando(false);
    }
  }

  const renderMensagem = (msg: Mensagem) => {
    const estilos = {
      sucesso: 'bg-emerald-light border border-emerald-500 text-emerald-900',
      erro: 'bg-red-50 border border-red-200 text-red-700',
      aviso: 'bg-mustard-light border border-yellow-400 text-yellow-900',
    };

    return (
      <div className={`p-4 rounded-lg flex gap-3 ${estilos[msg.tipo]}`}>
        {msg.tipo === 'sucesso' ? (
          <Check className="w-5 h-5 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
        )}
        <div className="flex-1">
          <div className="font-medium mb-1">{msg.titulo}</div>
          <p className="text-sm opacity-90">{msg.descricao}</p>
          {msg.titulo.includes('currículo') && (
            <Link
              href="/simulador-cv"
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium underline underline-offset-2"
            >
              <FileSearch size={14} />
              Ir para o Simulador de CV
            </Link>
          )}
        </div>
      </div>
    );
  };

  const renderBarraCompatibilidade = (valor: number, label: string) => {
    const percentual = Math.min(Math.max(valor, 0), 100);

    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-black">{label}</span>
          <span className="text-sm font-semibold text-black">{percentual}%</span>
        </div>
        <div className="w-full bg-line rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-mint-deep transition-all duration-500"
            style={{ width: `${percentual}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div>
      <Eyebrow>
        <Sparkles size={14} />
        Jornada de carreira
      </Eyebrow>
      <h2 className="font-display text-3xl text-black mb-2">Análise de compatibilidade</h2>
      <p className="text-sm text-gray-text mb-6 max-w-3xl">
        A SOMA usa automaticamente o currículo mais recente do Simulador de CV e cruza a vaga com sinais do seu
        autoconhecimento e desenvolvimento. O score técnico considera apenas evidências reais do currículo.
      </p>

      <Panel className="p-5 mb-6 border-mint bg-mint-light/40">
        <div className="flex items-start gap-3">
          <Compass size={18} className="text-mint-deep shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-black">Seu contexto acompanha você</p>
            <p className="text-sm text-gray-text mt-1">
              Currículo, VIA, Bússola e PDI são usados como contexto da jornada sem você precisar preencher tudo novamente.
              Você já acompanha {vagas.length} candidatura{vagas.length === 1 ? '' : 's'} no Kanban.
            </p>
          </div>
        </div>
      </Panel>

      {!analise ? (
        <div className="space-y-4">
          {mensagem && renderMensagem(mensagem)}

          <Panel className="p-6">
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <label>
                <span className="block text-sm font-medium text-black mb-2">Empresa</span>
                <input
                  type="text"
                  value={empresa}
                  onChange={(event) => setEmpresa(event.target.value)}
                  placeholder="Ex.: Nubank"
                  className="w-full px-4 py-2.5 border border-gray-faint rounded-lg focus:ring-2 focus:ring-mint-deep/30 focus:border-mint-deep bg-white text-black"
                />
              </label>
              <label>
                <span className="block text-sm font-medium text-black mb-2">Cargo</span>
                <input
                  type="text"
                  value={cargo}
                  onChange={(event) => setCargo(event.target.value)}
                  placeholder="Ex.: CRM Manager"
                  className="w-full px-4 py-2.5 border border-gray-faint rounded-lg focus:ring-2 focus:ring-mint-deep/30 focus:border-mint-deep bg-white text-black"
                />
              </label>
            </div>

            <label>
              <span className="block text-sm font-medium text-black mb-2">Descrição da vaga</span>
              <textarea
                value={descricaoVaga}
                onChange={(event) => setDescricaoVaga(event.target.value)}
                placeholder="Cole aqui a descrição completa da vaga..."
                rows={7}
                className="w-full px-4 py-3 border border-gray-faint rounded-lg focus:ring-2 focus:ring-mint-deep/30 focus:border-mint-deep bg-white text-black resize-y"
              />
            </label>

            <button
              onClick={analisarFit}
              disabled={analisando}
              className="mt-5 inline-flex items-center justify-center gap-2 bg-mint-deep text-white px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-60"
            >
              {analisando ? <Loader size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {analisando ? 'Cruzando sua jornada...' : 'Analisar compatibilidade'}
            </button>
          </Panel>
        </div>
      ) : (
        <div className="space-y-5">
          {mensagem && renderMensagem(mensagem)}

          <Panel className="p-6 border-mint bg-mint-light/35">
            <div className="flex flex-col md:flex-row md:items-center gap-5">
              <div className="w-28 h-28 rounded-full border-4 border-mint-deep flex items-center justify-center shrink-0">
                <span className="font-display text-4xl text-black">{analise.fit_score}%</span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-gray-text mb-1">Aderência estimada à vaga</p>
                <h3 className="font-display text-2xl text-black mb-2">{cargo} · {empresa}</h3>
                <p className="text-sm text-black leading-relaxed">{analise.resumo}</p>
              </div>
            </div>
          </Panel>

          <Panel className="p-6">
            <h3 className="font-medium text-black mb-4">Onde o fit está — e onde não está</h3>
            <div className="space-y-4">
              {renderBarraCompatibilidade(analise.breakdown_por_categoria.experiencia, 'Experiência')}
              {renderBarraCompatibilidade(analise.breakdown_por_categoria.skills_tecnicas, 'Skills técnicas')}
              {renderBarraCompatibilidade(analise.breakdown_por_categoria.senioridade, 'Senioridade')}
              {renderBarraCompatibilidade(analise.breakdown_por_categoria.contexto_setor, 'Contexto do setor')}
            </div>
          </Panel>

          <div className="grid md:grid-cols-2 gap-4">
            <Panel className="p-6">
              <h3 className="font-medium text-green-700 mb-4">Evidências a seu favor</h3>
              <ul className="space-y-2">
                {analise.pontos_fortes.map((ponto, index) => (
                  <li key={index} className="text-sm text-black flex gap-2">
                    <Check size={15} className="text-green-700 shrink-0 mt-0.5" />
                    <span>{ponto}</span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel className="p-6">
              <h3 className="font-medium text-amber-700 mb-4">Gaps ou evidências que faltam</h3>
              <ul className="space-y-2">
                {analise.gaps.map((gap, index) => (
                  <li key={index} className="text-sm text-black flex gap-2">
                    <AlertCircle size={15} className="text-amber-700 shrink-0 mt-0.5" />
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          {analise.contexto_soma && (
            <Panel className="p-6 border-mint">
              <div className="flex gap-3">
                <Compass size={18} className="text-mint-deep shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-gray-text mb-1">Leitura da sua jornada SOMA</p>
                  <p className="text-sm text-black leading-relaxed">{analise.contexto_soma}</p>
                </div>
              </div>
            </Panel>
          )}

          <Panel className="p-6">
            <h3 className="font-medium text-black mb-3">O que aumentar antes de se candidatar</h3>
            <ul className="space-y-2 mb-5">
              {analise.recomendacoes.map((recomendacao, index) => (
                <li key={index} className="text-sm text-black flex gap-2">
                  <span className="text-mint-deep font-semibold">{index + 1}.</span>
                  <span>{recomendacao}</span>
                </li>
              ))}
            </ul>
            {analise.palavras_chave_ats.length > 0 && (
              <>
                <p className="text-xs uppercase tracking-[0.14em] text-gray-text mb-2">Palavras-chave para revisar no CV</p>
                <div className="flex flex-wrap gap-2">
                  {analise.palavras_chave_ats.map((keyword, index) => (
                    <span key={index} className="px-3 py-1.5 rounded-full bg-mint-light border border-mint text-black text-xs">
                      {keyword}
                    </span>
                  ))}
                </div>
              </>
            )}
          </Panel>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={salvarVaga}
              disabled={salvando}
              className="inline-flex items-center justify-center gap-2 bg-mint-deep text-white px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-60"
            >
              {salvando && <Loader size={16} className="animate-spin" />}
              {salvando ? 'Salvando...' : 'Salvar vaga e acompanhar evolução'}
            </button>
            <button
              onClick={() => {
                setAnalise(null);
                setMensagem(null);
              }}
              className="border border-gray-faint text-black px-5 py-2.5 rounded-lg font-medium hover:bg-white transition-colors"
            >
              Analisar outra vaga
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
