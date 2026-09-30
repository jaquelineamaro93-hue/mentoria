'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  MessageSquareText,
  PlayCircle,
  RotateCcw,
  Send,
  Sparkles,
  Target,
} from 'lucide-react';
import { Panel, Eyebrow } from '@/components/Panel';

interface CandidaturaOption {
  id: string;
  empresa: string;
  cargo: string;
  descricao_vaga: string | null;
}

interface Pergunta {
  id: string;
  tipo: string;
  pergunta: string;
  objetivo: string;
}

interface Feedback {
  pergunta_id: string;
  score: number;
  pontos_fortes: string[];
  melhorias: string[];
  alerta_evidencia: string | null;
  resposta_reformulada: string;
}

interface ResumoFinal {
  score_final: number;
  leitura_geral: string;
  forcas_recorrentes: string[];
  prioridades_de_melhoria: string[];
  proxima_pratica: string;
}

export default function InterviewSimulator({
  curriculo,
  initialDescricaoVaga,
  applications = [],
  initialCandidaturaId = '',
}: {
  curriculo: string;
  initialDescricaoVaga: string;
  applications?: CandidaturaOption[];
  initialCandidaturaId?: string;
}) {
  const [candidaturaId, setCandidaturaId] = useState(initialCandidaturaId);
  const [descricaoVaga, setDescricaoVaga] = useState(initialDescricaoVaga);
  const [simulacaoId, setSimulacaoId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('Simulação de entrevista');
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [indice, setIndice] = useState(0);
  const [respostaAtual, setRespostaAtual] = useState('');
  const [feedbackAtual, setFeedbackAtual] = useState<Feedback | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [resumoFinal, setResumoFinal] = useState<ResumoFinal | null>(null);
  const [iniciando, setIniciando] = useState(false);
  const [avaliando, setAvaliando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!simulacaoId) setDescricaoVaga(initialDescricaoVaga);
  }, [initialDescricaoVaga, simulacaoId]);

  useEffect(() => {
    if (!simulacaoId) setCandidaturaId(initialCandidaturaId);
  }, [initialCandidaturaId, simulacaoId]);

  const perguntaAtual = perguntas[indice];
  const progresso = perguntas.length ? Math.round(((indice + 1) / perguntas.length) * 100) : 0;
  const candidaturaSelecionada = useMemo(
    () => applications.find((item) => item.id === candidaturaId),
    [applications, candidaturaId]
  );

  function selecionarCandidatura(id: string) {
    setCandidaturaId(id);
    const candidatura = applications.find((item) => item.id === id);
    if (candidatura?.descricao_vaga) setDescricaoVaga(candidatura.descricao_vaga);
  }

  async function iniciarSimulacao() {
    if (!curriculo.trim()) {
      setErro('Seu currículo ainda não está disponível. Volte para CV & aderência e faça uma análise primeiro.');
      return;
    }
    if (!descricaoVaga.trim()) {
      setErro('Selecione uma candidatura ou informe uma vaga antes de iniciar.');
      return;
    }

    setIniciando(true);
    setErro(null);
    setResumoFinal(null);

    try {
      const response = await fetch('/api/entrevista/simular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          curriculo,
          descricaoVaga,
          candidaturaId: candidaturaId || null,
        }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Não foi possível iniciar a simulação.');

      setSimulacaoId(data.simulacao.id);
      setTitulo(data.simulacao.titulo || 'Simulação de entrevista');
      setPerguntas(data.simulacao.perguntas || []);
      setIndice(0);
      setRespostaAtual('');
      setFeedbackAtual(null);
      setFeedbacks([]);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível iniciar a simulação.');
    } finally {
      setIniciando(false);
    }
  }

  async function enviarResposta() {
    if (!simulacaoId || !perguntaAtual || !respostaAtual.trim()) return;

    setAvaliando(true);
    setErro(null);

    try {
      const response = await fetch('/api/entrevista/simular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'answer',
          simulacaoId,
          pergunta: perguntaAtual,
          resposta: respostaAtual,
        }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Não foi possível avaliar sua resposta.');

      setFeedbackAtual(data.feedback);
      setFeedbacks((atuais) => [
        ...atuais.filter((item) => item.pergunta_id !== data.feedback.pergunta_id),
        data.feedback,
      ]);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível avaliar sua resposta.');
    } finally {
      setAvaliando(false);
    }
  }

  async function finalizarSimulacao() {
    if (!simulacaoId) return;

    setFinalizando(true);
    setErro(null);

    try {
      const response = await fetch('/api/entrevista/simular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'finish',
          simulacaoId,
        }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a simulação.');

      setResumoFinal(data.resumo);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível concluir a simulação.');
    } finally {
      setFinalizando(false);
    }
  }

  function avancar() {
    if (indice >= perguntas.length - 1) {
      void finalizarSimulacao();
      return;
    }

    setIndice((atual) => atual + 1);
    setRespostaAtual('');
    setFeedbackAtual(null);
    setErro(null);
  }

  function reiniciar() {
    setSimulacaoId(null);
    setTitulo('Simulação de entrevista');
    setPerguntas([]);
    setIndice(0);
    setRespostaAtual('');
    setFeedbackAtual(null);
    setFeedbacks([]);
    setResumoFinal(null);
    setErro(null);
  }

  if (resumoFinal) {
    return (
      <div className="space-y-5">
        <Eyebrow>
          <CheckCircle2 size={14} />
          Simulação concluída
        </Eyebrow>

        <Panel className="p-6 border-mint bg-mint-light/40">
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="w-24 h-24 rounded-full border-4 border-mint-deep bg-white grid place-items-center shrink-0">
              <div className="text-center">
                <p className="font-display text-3xl text-black">{resumoFinal.score_final}</p>
                <p className="text-[10px] uppercase tracking-wide text-gray-text">de 100</p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-gray-text mb-1">Leitura final</p>
              <h3 className="font-display text-2xl text-black mb-2">{titulo}</h3>
              <p className="text-sm text-black leading-relaxed">{resumoFinal.leitura_geral}</p>
            </div>
          </div>
        </Panel>

        <div className="grid md:grid-cols-2 gap-4">
          <Panel className="p-5">
            <h4 className="font-medium text-black mb-3">O que já está funcionando</h4>
            <ul className="space-y-2">
              {(resumoFinal.forcas_recorrentes || []).map((item, index) => (
                <li key={index} className="flex gap-2 text-sm text-black">
                  <CheckCircle2 size={15} className="text-green-700 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel className="p-5">
            <h4 className="font-medium text-black mb-3">Prioridades para melhorar</h4>
            <ul className="space-y-2">
              {(resumoFinal.prioridades_de_melhoria || []).map((item, index) => (
                <li key={index} className="flex gap-2 text-sm text-black">
                  <Target size={15} className="text-mint-deep shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel className="p-5 border-mint">
          <p className="text-xs uppercase tracking-[0.14em] text-gray-text mb-1">Próxima prática</p>
          <p className="text-sm text-black">{resumoFinal.proxima_pratica}</p>
        </Panel>

        <button
          type="button"
          onClick={reiniciar}
          className="inline-flex items-center gap-2 bg-mint-deep text-white px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition"
        >
          <RotateCcw size={17} />
          Fazer nova simulação
        </button>
      </div>
    );
  }

  if (!simulacaoId) {
    return (
      <div className="space-y-5">
        <Panel className="p-6 border-mint bg-mint-light/35">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-mint-deep text-white grid place-items-center shrink-0">
              <MessageSquareText size={21} />
            </div>
            <div>
              <h3 className="font-display text-2xl text-black mb-1">Simule a entrevista de verdade</h3>
              <p className="text-sm text-gray-text leading-relaxed max-w-3xl">
                Você recebe uma pergunta por vez, responde como responderia ao recrutador e a SOMA devolve feedback
                sobre clareza, evidências, estrutura e conexão com a vaga. São 5 perguntas personalizadas.
              </p>
            </div>
          </div>
        </Panel>

        {applications.length > 0 && (
          <Panel className="p-5">
            <label className="block">
              <span className="block text-sm font-medium text-black mb-2">Qual processo você quer simular?</span>
              <select
                value={candidaturaId}
                onChange={(event) => selecionarCandidatura(event.target.value)}
                className="w-full bg-white border border-gray-faint rounded-lg px-4 py-2.5 text-sm text-black focus:border-mint-deep"
              >
                <option value="">Usar a vaga trazida da etapa anterior</option>
                {applications.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.cargo} · {item.empresa}
                  </option>
                ))}
              </select>
              {candidaturaSelecionada && (
                <span className="block text-xs text-gray-text mt-2">
                  A simulação ficará vinculada a {candidaturaSelecionada.cargo} · {candidaturaSelecionada.empresa}.
                </span>
              )}
            </label>
          </Panel>
        )}

        <Panel className="p-5">
          <p className="text-sm font-medium text-black mb-1">Contexto que será usado</p>
          <p className="text-sm text-gray-text">
            A SOMA vai usar seu currículo atual, a descrição da vaga e os sinais já existentes da sua jornada.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs px-3 py-1.5 rounded-full border border-gray-faint bg-white text-black">
              Currículo {curriculo.trim() ? '✓' : 'pendente'}
            </span>
            <span className="text-xs px-3 py-1.5 rounded-full border border-gray-faint bg-white text-black">
              Vaga {descricaoVaga.trim() ? '✓' : 'pendente'}
            </span>
          </div>
        </Panel>

        {erro && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {erro}
          </div>
        )}

        <button
          type="button"
          onClick={iniciarSimulacao}
          disabled={iniciando || !curriculo.trim() || !descricaoVaga.trim()}
          className="inline-flex items-center gap-2 bg-mint-deep text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {iniciando ? <Loader2 size={19} className="animate-spin" /> : <PlayCircle size={19} />}
          {iniciando ? 'Preparando perguntas...' : 'Iniciar entrevista simulada'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between gap-4 mb-2">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-gray-text">Entrevista em andamento</p>
            <h3 className="font-display text-2xl text-black">{titulo}</h3>
          </div>
          <span className="text-sm font-medium text-black shrink-0">
            {indice + 1} de {perguntas.length}
          </span>
        </div>
        <div className="w-full h-2 bg-line rounded-full overflow-hidden">
          <div
            className="h-full bg-mint-deep transition-all duration-300"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </div>

      <Panel className="p-6 border-mint">
        <p className="text-[11px] uppercase tracking-[0.14em] text-gray-text mb-2">{perguntaAtual?.tipo}</p>
        <p className="font-display text-xl md:text-2xl text-black leading-snug">{perguntaAtual?.pergunta}</p>
        <p className="text-xs text-gray-text mt-3">
          O recrutador está observando: {perguntaAtual?.objetivo}
        </p>
      </Panel>

      <Panel className="p-6">
        <label className="block">
          <span className="block text-sm font-medium text-black mb-2">Sua resposta</span>
          <textarea
            value={respostaAtual}
            onChange={(event) => {
              setRespostaAtual(event.target.value);
              if (feedbackAtual) setFeedbackAtual(null);
            }}
            disabled={avaliando}
            rows={7}
            placeholder="Responda como se estivesse falando com o recrutador. Use exemplos, contexto e resultados quando fizer sentido..."
            className="w-full bg-white border border-gray-faint rounded-lg px-4 py-3 text-sm text-black focus:outline-none focus:border-mint-deep resize-y disabled:opacity-70"
          />
        </label>

        {!feedbackAtual && (
          <button
            type="button"
            onClick={enviarResposta}
            disabled={avaliando || !respostaAtual.trim()}
            className="mt-4 inline-flex items-center gap-2 bg-mint-deep text-white px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {avaliando ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
            {avaliando ? 'Analisando sua resposta...' : 'Enviar resposta'}
          </button>
        )}
      </Panel>

      {erro && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      {feedbackAtual && (
        <Panel className="p-6 bg-[#fbfcfd] border-mint">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <Eyebrow>
                <Sparkles size={13} />
                Feedback da resposta
              </Eyebrow>
              <p className="text-sm text-gray-text">A avaliação considera a resposta dada e as evidências do seu currículo.</p>
            </div>
            <div className="w-16 h-16 rounded-full border-2 border-mint-deep bg-white grid place-items-center shrink-0">
              <span className="font-display text-2xl text-black">{feedbackAtual.score}</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="rounded-xl border border-gray-faint bg-white p-4">
              <p className="text-sm font-medium text-black mb-2">O que funcionou</p>
              <ul className="space-y-2">
                {feedbackAtual.pontos_fortes.map((item, index) => (
                  <li key={index} className="flex gap-2 text-sm text-black">
                    <CheckCircle2 size={14} className="text-green-700 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-gray-faint bg-white p-4">
              <p className="text-sm font-medium text-black mb-2">Como fortalecer</p>
              <ul className="space-y-2">
                {feedbackAtual.melhorias.map((item, index) => (
                  <li key={index} className="flex gap-2 text-sm text-black">
                    <Target size={14} className="text-mint-deep shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {feedbackAtual.alerta_evidencia && (
            <div className="mb-4 flex gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
              <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-900 mb-1">Cheque antes de usar na entrevista</p>
                <p className="text-sm text-amber-900">{feedbackAtual.alerta_evidencia}</p>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-mint bg-mint-light/35 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-gray-text mb-2">Uma versão mais forte da sua resposta</p>
            <p className="text-sm text-black leading-relaxed whitespace-pre-wrap">{feedbackAtual.resposta_reformulada}</p>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={avancar}
              disabled={finalizando}
              className="inline-flex items-center gap-2 bg-mint-deep text-white px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {finalizando ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Gerando resultado...
                </>
              ) : indice >= perguntas.length - 1 ? (
                <>
                  Concluir simulação
                  <CheckCircle2 size={17} />
                </>
              ) : (
                <>
                  Próxima pergunta
                  <ChevronRight size={17} />
                </>
              )}
            </button>
          </div>
        </Panel>
      )}
    </div>
  );
}
