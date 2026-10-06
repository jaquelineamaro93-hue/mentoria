'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  CircleUserRound,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Panel, Eyebrow } from '@/components/Panel';
import { posthog } from '@/lib/posthog';
import type {
  Feedback360Answer,
  Feedback360Closeness,
  Feedback360Question,
  Feedback360Relationship,
  Feedback360Respondent,
  Feedback360Round,
  Feedback360Summary,
  Feedback360SummaryData,
} from '@/lib/types';

interface Props {
  userId: string;
  rounds: Feedback360Round[];
  questions: Feedback360Question[];
  respondents: Feedback360Respondent[];
  answers: Feedback360Answer[];
  summaries: Feedback360Summary[];
}

const PERGUNTAS_PADRAO = [
  'O que você mais admira em mim?',
  'O que você gostaria de ver mais em mim e o que gostaria de ver menos?',
  'Como você acha que as pessoas que me conhecem menos que você me enxergam? Cite pelo menos uma característica positiva e uma que eu possa desenvolver.',
];

const RELACOES: Array<{ value: Feedback360Relationship; label: string }> = [
  { value: 'gestor_direto', label: 'Gestor direto' },
  { value: 'lideranca_indireta', label: 'Liderança indireta' },
  { value: 'responde_a_mim', label: 'Responde a mim' },
  { value: 'par', label: 'Par / colega' },
  { value: 'stakeholder', label: 'Stakeholder' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'fornecedor', label: 'Fornecedor' },
  { value: 'colega_faculdade', label: 'Colega de faculdade' },
  { value: 'professor', label: 'Professor(a)' },
  { value: 'amigo_pessoal', label: 'Relação pessoal' },
  { value: 'outro', label: 'Outro' },
];

const CONVIVENCIAS: Array<{ value: Feedback360Closeness; label: string }> = [
  { value: 'alta', label: 'Alta convivência' },
  { value: 'media', label: 'Convivência regular' },
  { value: 'baixa', label: 'Pouca convivência' },
];

function mesAnoAtual() {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date());
}

function labelRelacao(value: Feedback360Relationship, outro?: string | null) {
  if (value === 'outro' && outro) return outro;
  return RELACOES.find((item) => item.value === value)?.label ?? 'Outra relação';
}

function dataPtBr(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function Percepcao360Client({
  userId,
  rounds: roundsProp,
  questions: questionsProp,
  respondents: respondentsProp,
  answers: answersProp,
  summaries: summariesProp,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [rounds, setRounds] = useState(roundsProp);
  const [questions, setQuestions] = useState(questionsProp);
  const [respondents, setRespondents] = useState(respondentsProp);
  const [answers, setAnswers] = useState(answersProp);
  const [summaries, setSummaries] = useState(summariesProp);

  const [selectedRoundId, setSelectedRoundId] = useState(roundsProp[0]?.id ?? '');
  const [showNewRound, setShowNewRound] = useState(roundsProp.length === 0);
  const [titulo, setTitulo] = useState(`Percepção profissional · ${mesAnoAtual()}`);
  const [objetivo, setObjetivo] = useState(
    'Entender como pessoas de diferentes relações profissionais percebem minhas forças e pontos de desenvolvimento.'
  );
  const [draftQuestions, setDraftQuestions] = useState([...PERGUNTAS_PADRAO]);
  const [creatingRound, setCreatingRound] = useState(false);

  const [editingRespondentId, setEditingRespondentId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState('');
  const [contexto, setContexto] = useState('');
  const [relacao, setRelacao] = useState<Feedback360Relationship>('par');
  const [relacaoOutro, setRelacaoOutro] = useState('');
  const [convivencia, setConvivencia] = useState<Feedback360Closeness>('media');
  const [respostasForm, setRespostasForm] = useState<Record<string, string>>({});
  const [savingRespondent, setSavingRespondent] = useState(false);

  const [savingQuestions, setSavingQuestions] = useState(false);
  const [editingQuestions, setEditingQuestions] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  useEffect(() => {
    setRounds(roundsProp);
    setQuestions(questionsProp);
    setRespondents(respondentsProp);
    setAnswers(answersProp);
    setSummaries(summariesProp);
    setSelectedRoundId((current) =>
      roundsProp.some((round) => round.id === current)
        ? current
        : roundsProp[0]?.id ?? ''
    );
  }, [roundsProp, questionsProp, respondentsProp, answersProp, summariesProp]);

  const selectedRound = rounds.find((round) => round.id === selectedRoundId) ?? null;

  const selectedQuestions = useMemo(
    () =>
      questions
        .filter((question) => question.round_id === selectedRoundId)
        .sort((a, b) => a.ordem - b.ordem),
    [questions, selectedRoundId]
  );

  const selectedRespondents = useMemo(
    () => respondents.filter((respondent) => respondent.round_id === selectedRoundId),
    [respondents, selectedRoundId]
  );

  const selectedAnswers = useMemo(
    () => answers.filter((answer) => answer.round_id === selectedRoundId),
    [answers, selectedRoundId]
  );

  const selectedSummary =
    summaries.find((summary) => summary.round_id === selectedRoundId) ?? null;

  const perguntasEditaveis = selectedRespondents.length === 0;
  const pessoasComRespostas = selectedRespondents.filter((respondent) =>
    selectedAnswers.some(
      (answer) => answer.respondent_id === respondent.id && Boolean(answer.resposta?.trim())
    )
  ).length;

  function resetRespondentForm() {
    setEditingRespondentId(null);
    setNome('');
    setCargo('');
    setContexto('');
    setRelacao('par');
    setRelacaoOutro('');
    setConvivencia('media');
    setRespostasForm({});
  }

  function editRespondent(respondent: Feedback360Respondent) {
    setEditingRespondentId(respondent.id);
    setNome(respondent.nome ?? '');
    setCargo(respondent.cargo_funcao ?? '');
    setContexto(respondent.empresa_contexto ?? '');
    setRelacao(respondent.relacao);
    setRelacaoOutro(respondent.relacao_outro ?? '');
    setConvivencia(respondent.convivencia);

    const next: Record<string, string> = {};
    selectedAnswers
      .filter((answer) => answer.respondent_id === respondent.id)
      .forEach((answer) => {
        next[answer.question_id] = answer.resposta;
      });
    setRespostasForm(next);
    setErro(null);
    setSucesso(null);
  }

  async function createRound() {
    const perguntasValidas = draftQuestions.map((item) => item.trim()).filter(Boolean);
    if (!titulo.trim() || perguntasValidas.length === 0) {
      setErro('Dê um nome para a rodada e mantenha pelo menos uma pergunta.');
      return;
    }

    setCreatingRound(true);
    setErro(null);
    setSucesso(null);

    const { data, error } = await supabase.rpc('criar_feedback_360_rodada', {
      p_titulo: titulo.trim(),
      p_objetivo: objetivo.trim(),
      p_perguntas: perguntasValidas,
    });

    setCreatingRound(false);

    if (error || !data) {
      setErro(error?.message || 'Não foi possível criar a rodada.');
      return;
    }

    setSelectedRoundId(String(data));
    setShowNewRound(false);
    setEditingQuestions(false);
    setSucesso('Rodada criada e salva no portal.');
    posthog.capture('feedback_360_rodada_criada', { perguntas: perguntasValidas.length });
    router.refresh();
  }

  async function saveQuestions() {
    if (!selectedRound || !perguntasEditaveis || !editingQuestions) return;

    const atuais = selectedQuestions.filter((question) => question.pergunta.trim());
    if (atuais.length === 0) {
      setErro('A rodada precisa ter pelo menos uma pergunta.');
      return;
    }

    setSavingQuestions(true);
    setErro(null);

    for (const question of atuais) {
      const { error } = await supabase
        .from('feedback_360_questions')
        .update({ pergunta: question.pergunta.trim() })
        .eq('id', question.id)
        .eq('user_id', userId);

      if (error) {
        setSavingQuestions(false);
        setErro('Não foi possível salvar as perguntas.');
        return;
      }
    }

    setSavingQuestions(false);
    setEditingQuestions(false);
    setSucesso('Perguntas atualizadas.');
    router.refresh();
  }

  async function addQuestion() {
    if (!selectedRound || !perguntasEditaveis || !editingQuestions) return;

    const nextOrder =
      selectedQuestions.length > 0
        ? Math.max(...selectedQuestions.map((question) => question.ordem)) + 1
        : 1;

    const { data, error } = await supabase
      .from('feedback_360_questions')
      .insert({
        round_id: selectedRound.id,
        user_id: userId,
        ordem: nextOrder,
        pergunta: 'Nova pergunta',
      })
      .select()
      .single();

    if (error || !data) {
      setErro('Não foi possível adicionar a pergunta.');
      return;
    }

    setQuestions((prev) => [...prev, data as Feedback360Question]);
  }

  async function deleteQuestion(questionId: string) {
    if (!selectedRound || !perguntasEditaveis || !editingQuestions || selectedQuestions.length <= 1) return;

    const { error } = await supabase
      .from('feedback_360_questions')
      .delete()
      .eq('id', questionId)
      .eq('user_id', userId);

    if (error) {
      setErro('Não foi possível remover a pergunta.');
      return;
    }

    setQuestions((prev) => prev.filter((question) => question.id !== questionId));
    router.refresh();
  }

  async function saveRespondent() {
    if (!selectedRound) return;

    const respostas = selectedQuestions
      .map((question) => ({
        question_id: question.id,
        resposta: (respostasForm[question.id] ?? '').trim(),
      }))
      .filter((item) => item.resposta);

    if (respostas.length === 0) {
      setErro('Preencha pelo menos uma resposta dessa pessoa.');
      return;
    }

    if (!cargo.trim() && !nome.trim()) {
      setErro('Informe pelo menos o nome ou a função da pessoa para dar contexto ao feedback.');
      return;
    }

    setSavingRespondent(true);
    setErro(null);
    setSucesso(null);

    const { data, error } = await supabase.rpc('salvar_feedback_360_respondente', {
      p_round_id: selectedRound.id,
      p_respondent_id: editingRespondentId,
      p_nome: nome.trim(),
      p_cargo_funcao: cargo.trim(),
      p_empresa_contexto: contexto.trim(),
      p_relacao: relacao,
      p_relacao_outro: relacaoOutro.trim(),
      p_convivencia: convivencia,
      p_respostas: respostas,
    });

    setSavingRespondent(false);

    if (error || !data) {
      setErro(error?.message || 'Não foi possível salvar esse feedback.');
      return;
    }

    setSucesso(editingRespondentId ? 'Feedback atualizado.' : 'Feedback salvo com segurança.');
    posthog.capture('feedback_360_resposta_salva', {
      respostas: respostas.length,
      edicao: Boolean(editingRespondentId),
    });
    resetRespondentForm();
    router.refresh();
  }

  async function generateSummary() {
    if (!selectedRound || pessoasComRespostas === 0) return;

    setGenerating(true);
    setErro(null);
    setSucesso(null);

    try {
      const response = await fetch('/api/percepcao-360/analisar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ roundId: selectedRound.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível gerar a leitura 360.');
      }

      const novoResumo: Feedback360Summary = {
        id: selectedSummary?.id ?? 'local',
        round_id: selectedRound.id,
        user_id: userId,
        resumo_json: data.resumo as Feedback360SummaryData,
        status: 'concluida',
        erro_analise: null,
        source_updated_at: new Date().toISOString(),
        created_at: selectedSummary?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setSummaries((prev) => [
        novoResumo,
        ...prev.filter((summary) => summary.round_id !== selectedRound.id),
      ]);
      setSucesso(data.cached ? 'Leitura atualizada a partir do que já estava salvo.' : 'Leitura 360 gerada e salva.');
      posthog.capture('feedback_360_analise_gerada', {
        pessoas: pessoasComRespostas,
        cached: Boolean(data.cached),
      });
      router.refresh();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível gerar a leitura agora.'
      );
    } finally {
      setGenerating(false);
    }
  }

  const resumo = selectedSummary?.resumo_json ?? null;

  return (
    <main className="px-6 py-8 md:px-12 md:py-10 w-full">
      <header className="max-w-4xl mb-8">
        <Eyebrow>
          <CircleUserRound size={13} /> Percepção 360
        </Eyebrow>
        <h1 className="font-display text-3xl md:text-4xl text-black">
          Como outras pessoas percebem você
        </h1>
        <p className="mt-2 text-sm md:text-base leading-7 text-gray-text max-w-3xl">
          Registre rodadas de feedback com pessoas de contextos diferentes. A SOMA separa
          recorrências de opiniões isoladas e cruza a percepção externa com o seu diagnóstico.
        </p>
      </header>

      {erro && (
        <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </p>
      )}

      {sucesso && (
        <p className="mb-5 rounded-lg border border-mint bg-mint-light/50 px-4 py-3 text-sm text-black">
          {sucesso}
        </p>
      )}

      <div className="grid xl:grid-cols-[300px_minmax(0,1fr)] gap-6">
        <aside>
          <Panel className="p-4 sticky top-24">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-text">Rodadas</p>
                <p className="text-sm text-black mt-1">{rounds.length} salvas</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewRound(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-mint-light px-3 py-2 text-xs font-medium text-black"
              >
                <Plus size={14} /> Nova
              </button>
            </div>

            {rounds.length === 0 ? (
              <p className="text-sm leading-6 text-gray-text">
                Crie sua primeira rodada para começar a registrar percepções externas.
              </p>
            ) : (
              <div className="space-y-2">
                {rounds.map((round) => {
                  const ativo = round.id === selectedRoundId;
                  const qtd = respondents.filter((item) => item.round_id === round.id).length;
                  return (
                    <button
                      key={round.id}
                      type="button"
                      onClick={() => {
                        setSelectedRoundId(round.id);
                        setShowNewRound(false);
                        setEditingQuestions(false);
                        resetRespondentForm();
                        setErro(null);
                        setSucesso(null);
                      }}
                      className={[
                        'w-full rounded-lg border p-3 text-left transition',
                        ativo
                          ? 'border-mint bg-mint-light/40'
                          : 'border-gray-faint bg-white hover:border-mint',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-black line-clamp-2">{round.titulo}</p>
                          <p className="text-[11px] text-gray-text mt-1">
                            {qtd} {qtd === 1 ? 'pessoa' : 'pessoas'} · {dataPtBr(round.updated_at)}
                          </p>
                        </div>
                        <ChevronRight size={15} className="shrink-0 text-gray-text mt-0.5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Panel>
        </aside>

        <section className="min-w-0">
          {showNewRound ? (
            <Panel className="p-5 md:p-6">
              <div className="mb-5">
                <p className="text-xs uppercase tracking-wide text-mint-deep">Nova rodada</p>
                <h2 className="font-display text-2xl text-black mt-1">Defina o objetivo e as perguntas</h2>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs uppercase tracking-wide text-gray-text">Nome da rodada</span>
                  <input
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-gray-faint bg-white px-4 py-3 text-sm text-black focus:border-mint-deep outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-xs uppercase tracking-wide text-gray-text">Objetivo</span>
                  <textarea
                    value={objetivo}
                    onChange={(e) => setObjetivo(e.target.value)}
                    rows={3}
                    className="mt-1.5 w-full rounded-lg border border-gray-faint bg-white px-4 py-3 text-sm text-black focus:border-mint-deep outline-none resize-y"
                  />
                </label>

                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-xs uppercase tracking-wide text-gray-text">Perguntas</span>
                    <button
                      type="button"
                      onClick={() => setDraftQuestions((prev) => [...prev, ''])}
                      className="text-xs font-medium text-mint-deep"
                    >
                      + Adicionar pergunta
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {draftQuestions.map((question, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="mt-3 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint-light text-[11px] text-black">
                          {index + 1}
                        </span>
                        <textarea
                          value={question}
                          onChange={(e) =>
                            setDraftQuestions((prev) =>
                              prev.map((item, i) => (i === index ? e.target.value : item))
                            )
                          }
                          rows={2}
                          className="flex-1 rounded-lg border border-gray-faint bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-mint-deep resize-y"
                        />
                        {draftQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setDraftQuestions((prev) => prev.filter((_, i) => i !== index))
                            }
                            className="mt-2 text-gray-text hover:text-red-600"
                            aria-label="Remover pergunta"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={createRound}
                    disabled={creatingRound}
                    className="inline-flex items-center gap-2 rounded-lg bg-brown px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {creatingRound ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    {creatingRound ? 'Criando...' : 'Criar rodada'}
                  </button>
                  {rounds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowNewRound(false)}
                      className="rounded-lg border border-gray-faint bg-white px-4 py-2.5 text-sm text-black"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </Panel>
          ) : selectedRound ? (
            <div className="space-y-6">
              <Panel className="p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-mint-deep">Rodada atual</p>
                    <h2 className="font-display text-2xl text-black mt-1 break-words">
                      {selectedRound.titulo}
                    </h2>
                    {selectedRound.objetivo && (
                      <p className="text-sm leading-6 text-gray-text mt-2 max-w-3xl">
                        {selectedRound.objetivo}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-text">
                    {selectedRespondents.length} pessoas · {pessoasComRespostas} com respostas
                  </div>
                </div>
              </Panel>

              <Panel className="p-5 md:p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-text">Perguntas da rodada</p>
                    <p className="text-sm text-black mt-1">
                      {perguntasEditaveis
                        ? editingQuestions
                          ? 'Modo de edição ativo. Altere apenas o questionário; as respostas são preenchidas na seção “Registrar feedback” abaixo.'
                          : 'Estas são as perguntas que a pessoa vai responder. Elas ficam protegidas por padrão para evitar respostas digitadas no lugar errado.'
                        : 'As perguntas ficam protegidas depois que a coleta começa.'}
                    </p>
                  </div>
                  {perguntasEditaveis && !editingQuestions && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQuestions(true);
                        setErro(null);
                        setSucesso(null);
                      }}
                      className="rounded-lg border border-gray-faint bg-white px-3 py-2 text-xs font-medium text-black whitespace-nowrap"
                    >
                      Editar perguntas
                    </button>
                  )}
                  {perguntasEditaveis && editingQuestions && (
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="text-xs font-medium text-mint-deep whitespace-nowrap"
                    >
                      + Pergunta
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {selectedQuestions.map((question) => (
                    <div key={question.id} className="flex items-start gap-2">
                      <span className="mt-2 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint-light text-[11px] text-black">
                        {question.ordem}
                      </span>
                      {perguntasEditaveis && editingQuestions ? (
                        <textarea
                          value={question.pergunta}
                          onChange={(e) =>
                            setQuestions((prev) =>
                              prev.map((item) =>
                                item.id === question.id
                                  ? { ...item, pergunta: e.target.value }
                                  : item
                              )
                            )
                          }
                          rows={2}
                          className="flex-1 rounded-lg border border-gray-faint px-3 py-2 text-sm text-black outline-none focus:border-mint-deep resize-y"
                        />
                      ) : (
                        <p className="flex-1 pt-2 text-sm leading-5 text-black">{question.pergunta}</p>
                      )}

                      {perguntasEditaveis && editingQuestions && selectedQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => deleteQuestion(question.id)}
                          className="mt-2 text-gray-text hover:text-red-600"
                          aria-label="Remover pergunta"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {perguntasEditaveis && editingQuestions && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={saveQuestions}
                      disabled={savingQuestions}
                      className="inline-flex items-center gap-2 rounded-lg bg-brown px-3.5 py-2 text-xs font-medium text-white disabled:opacity-50"
                    >
                      {savingQuestions ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Salvar perguntas
                    </button>
                  </div>
                )}
              </Panel>

              <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
                <Panel className="p-5 md:p-6">
                  <div className="mb-5">
                    <Eyebrow>
                      <Users size={13} /> {editingRespondentId ? 'Editar feedback' : 'Registrar feedback'}
                    </Eyebrow>
                    <p className="text-sm leading-6 text-gray-text">
                      <strong>É aqui que a pessoa responde.</strong> Preencha o contexto e escreva as respostas
                      nos campos logo abaixo. A área “Perguntas da rodada” serve apenas para configurar o questionário.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 mb-4">
                    <label>
                      <span className="text-xs uppercase tracking-wide text-gray-text">Nome opcional</span>
                      <input
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Ex.: Igor"
                        className="mt-1.5 w-full rounded-lg border border-gray-faint px-3 py-2.5 text-sm text-black outline-none focus:border-mint-deep"
                      />
                    </label>
                    <label>
                      <span className="text-xs uppercase tracking-wide text-gray-text">Cargo / função</span>
                      <input
                        value={cargo}
                        onChange={(e) => setCargo(e.target.value)}
                        placeholder="Ex.: Tech Lead"
                        className="mt-1.5 w-full rounded-lg border border-gray-faint px-3 py-2.5 text-sm text-black outline-none focus:border-mint-deep"
                      />
                    </label>
                    <label>
                      <span className="text-xs uppercase tracking-wide text-gray-text">Empresa / contexto</span>
                      <input
                        value={contexto}
                        onChange={(e) => setContexto(e.target.value)}
                        placeholder="Ex.: Trabalho atual"
                        className="mt-1.5 w-full rounded-lg border border-gray-faint px-3 py-2.5 text-sm text-black outline-none focus:border-mint-deep"
                      />
                    </label>
                    <label>
                      <span className="text-xs uppercase tracking-wide text-gray-text">Relação</span>
                      <select
                        value={relacao}
                        onChange={(e) => setRelacao(e.target.value as Feedback360Relationship)}
                        className="mt-1.5 w-full rounded-lg border border-gray-faint bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-mint-deep"
                      >
                        {RELACOES.map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </select>
                    </label>
                    {relacao === 'outro' && (
                      <label>
                        <span className="text-xs uppercase tracking-wide text-gray-text">Qual relação?</span>
                        <input
                          value={relacaoOutro}
                          onChange={(e) => setRelacaoOutro(e.target.value)}
                          className="mt-1.5 w-full rounded-lg border border-gray-faint px-3 py-2.5 text-sm text-black outline-none focus:border-mint-deep"
                        />
                      </label>
                    )}
                    <label>
                      <span className="text-xs uppercase tracking-wide text-gray-text">Nível de convivência</span>
                      <select
                        value={convivencia}
                        onChange={(e) => setConvivencia(e.target.value as Feedback360Closeness)}
                        className="mt-1.5 w-full rounded-lg border border-gray-faint bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-mint-deep"
                      >
                        {CONVIVENCIAS.map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="space-y-4">
                    {selectedQuestions.map((question) => (
                      <label key={question.id} className="block">
                        <span className="text-sm font-medium text-black">
                          {question.ordem}. {question.pergunta}
                        </span>
                        <textarea
                          value={respostasForm[question.id] ?? ''}
                          onChange={(e) =>
                            setRespostasForm((prev) => ({
                              ...prev,
                              [question.id]: e.target.value,
                            }))
                          }
                          rows={3}
                          className="mt-1.5 w-full rounded-lg border border-gray-faint px-3 py-2.5 text-sm leading-6 text-black outline-none focus:border-mint-deep resize-y"
                          placeholder="Cole ou escreva a resposta..."
                        />
                      </label>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-5">
                    <button
                      type="button"
                      onClick={saveRespondent}
                      disabled={savingRespondent}
                      className="inline-flex items-center gap-2 rounded-lg bg-brown px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {savingRespondent ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                      {savingRespondent
                        ? 'Salvando...'
                        : editingRespondentId
                          ? 'Atualizar feedback'
                          : 'Salvar feedback'}
                    </button>
                    {editingRespondentId && (
                      <button
                        type="button"
                        onClick={resetRespondentForm}
                        className="rounded-lg border border-gray-faint bg-white px-4 py-2.5 text-sm text-black"
                      >
                        Cancelar edição
                      </button>
                    )}
                  </div>
                </Panel>

                <Panel className="p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-text mb-3">
                    Pessoas consultadas
                  </p>

                  {selectedRespondents.length === 0 ? (
                    <p className="text-sm leading-6 text-gray-text">
                      Nenhum feedback registrado ainda.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedRespondents.map((respondent, index) => {
                        const count = selectedAnswers.filter(
                          (answer) => answer.respondent_id === respondent.id && answer.resposta?.trim()
                        ).length;
                        return (
                          <button
                            key={respondent.id}
                            type="button"
                            onClick={() => editRespondent(respondent)}
                            className={[
                              'w-full rounded-lg border p-3 text-left transition',
                              editingRespondentId === respondent.id
                                ? 'border-mint bg-mint-light/40'
                                : 'border-gray-faint bg-white hover:border-mint',
                            ].join(' ')}
                          >
                            <p className="text-sm font-medium text-black">
                              {respondent.nome || respondent.cargo_funcao || `Pessoa ${index + 1}`}
                            </p>
                            <p className="text-[11px] text-gray-text mt-1">
                              {[respondent.cargo_funcao, labelRelacao(respondent.relacao, respondent.relacao_outro)]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                            <p className="text-[10px] text-mint-deep mt-1.5">
                              {count} {count === 1 ? 'resposta salva' : 'respostas salvas'}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </Panel>
              </div>

              <Panel className="p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <Eyebrow>
                      <Sparkles size={13} /> Leitura 360
                    </Eyebrow>
                    <h3 className="font-display text-2xl text-black">O que o conjunto está dizendo</h3>
                    <p className="mt-1 text-sm leading-6 text-gray-text max-w-3xl">
                      A análise usa recorrência, contexto da relação e o seu diagnóstico atual.
                      Uma opinião individual continua sendo tratada como percepção, não como fato.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={generateSummary}
                    disabled={generating || pessoasComRespostas === 0}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-mint-deep px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {generating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                    {generating
                      ? 'Analisando...'
                      : resumo
                        ? 'Atualizar leitura'
                        : 'Gerar leitura 360'}
                  </button>
                </div>

                {selectedSummary?.status === 'erro' && !resumo && (
                  <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Os feedbacks estão salvos. A leitura automática falhou na última tentativa e pode ser refeita sem perder respostas.
                  </p>
                )}

                {resumo ? (
                  <div className="mt-6 space-y-5">
                    <div className="rounded-xl border border-mint bg-mint-light/30 p-4">
                      <p className="text-sm leading-6 text-black">{resumo.resumo}</p>
                      <p className="mt-2 text-xs text-gray-text">
                        Confiança da leitura: {resumo.confianca_leitura} · {resumo.observacao_amostra}
                      </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-text mb-2">
                          Forças percebidas de forma recorrente
                        </p>
                        <div className="space-y-2">
                          {resumo.forcas_recorrentes.length === 0 ? (
                            <p className="text-sm text-gray-text">Ainda não há recorrência suficiente.</p>
                          ) : (
                            resumo.forcas_recorrentes.map((item) => (
                              <div key={item.tema} className="rounded-lg border border-gray-faint p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm font-medium text-black">{item.tema}</p>
                                  <span className="rounded-full bg-mint-light px-2 py-0.5 text-[10px] text-black">
                                    {item.contagem} percepções
                                  </span>
                                </div>
                                <p className="mt-1 text-xs leading-5 text-gray-text">{item.leitura}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-text mb-2">
                          Desenvolvimento recorrente
                        </p>
                        <div className="space-y-2">
                          {resumo.desenvolvimento_recorrente.length === 0 ? (
                            <p className="text-sm text-gray-text">Nenhum padrão recorrente identificado.</p>
                          ) : (
                            resumo.desenvolvimento_recorrente.map((item) => (
                              <div key={item.tema} className="rounded-lg border border-gray-faint p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm font-medium text-black">{item.tema}</p>
                                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800">
                                    {item.contagem} percepções
                                  </span>
                                </div>
                                <p className="mt-1 text-xs leading-5 text-gray-text">{item.leitura}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {resumo.autopercepcao_vs_externa.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-text mb-2">
                          Autopercepção × percepção externa
                        </p>
                        <div className="grid md:grid-cols-2 gap-2.5">
                          {resumo.autopercepcao_vs_externa.map((item) => (
                            <div key={`${item.tema}-${item.tipo}`} className="rounded-lg border border-gray-faint p-3">
                              <p className="text-[10px] uppercase tracking-wide text-mint-deep">
                                {item.tipo}
                              </p>
                              <p className="text-sm font-medium text-black mt-1">{item.tema}</p>
                              <p className="text-xs leading-5 text-gray-text mt-1">{item.leitura}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-text mb-2">
                        O que levar para o PDI
                      </p>
                      <div className="grid md:grid-cols-2 gap-3">
                        {resumo.prioridades_pdi.map((item, index) => (
                          <div key={item.titulo} className="rounded-xl border border-mint p-4">
                            <div className="flex items-start gap-3">
                              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-mint-deep text-xs font-medium text-white">
                                {index + 1}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-black">{item.titulo}</p>
                                {item.por_que && (
                                  <p className="mt-1 text-xs leading-5 text-gray-text">{item.por_que}</p>
                                )}
                                <p className="mt-2 text-xs leading-5 text-black">
                                  <strong>Ação:</strong> {item.acao}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {(resumo.percepcoes_isoladas.length > 0 || resumo.pontos_cegos.length > 0) && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-text mb-2">
                            Percepções isoladas para observar
                          </p>
                          <div className="space-y-2">
                            {resumo.percepcoes_isoladas.map((item) => (
                              <div key={`${item.tema}-${item.fonte}`} className="rounded-lg bg-gray-50 p-3">
                                <p className="text-sm font-medium text-black">{item.tema}</p>
                                <p className="text-[10px] text-gray-text mt-0.5">{item.fonte}</p>
                                <p className="text-xs leading-5 text-gray-text mt-1">{item.leitura}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-text mb-2">
                            Possíveis pontos cegos
                          </p>
                          <div className="space-y-2">
                            {resumo.pontos_cegos.map((item) => (
                              <div key={item.tema} className="rounded-lg bg-gray-50 p-3">
                                <p className="text-sm font-medium text-black">{item.tema}</p>
                                <p className="text-xs leading-5 text-gray-text mt-1">{item.leitura}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 rounded-xl border border-dashed border-gray-faint px-5 py-8 text-center">
                    <Sparkles size={22} className="mx-auto text-gray-text mb-2" />
                    <p className="text-sm text-black">Sua leitura ainda não foi gerada.</p>
                    <p className="text-xs text-gray-text mt-1">
                      Quanto mais relações diferentes responderem, mais forte fica a triangulação.
                    </p>
                  </div>
                )}
              </Panel>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
