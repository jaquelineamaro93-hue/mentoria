import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { chamarClaudeJson } from '@/lib/ai-json';
import { montarPromptFeedback360 } from '@/lib/prompts-feedback360';
import type {
  Feedback360SummaryData,
  Feedback360Pattern,
  Feedback360Evidence,
  Feedback360Isolated,
  Feedback360BlindSpot,
  Feedback360SelfExternal,
  Feedback360PdiPriority,
} from '@/lib/types';

export const dynamic = 'force-dynamic';

const RELACAO_LABEL: Record<string, string> = {
  gestor_direto: 'gestor direto',
  lideranca_indireta: 'liderança indireta',
  responde_a_mim: 'pessoa que responde a mim',
  par: 'par',
  stakeholder: 'stakeholder',
  cliente: 'cliente',
  fornecedor: 'fornecedor',
  colega_faculdade: 'colega de faculdade',
  professor: 'professor',
  amigo_pessoal: 'relação pessoal',
  outro: 'outra relação',
};

const CONVIVENCIA_LABEL: Record<string, string> = {
  alta: 'alta',
  media: 'média',
  baixa: 'baixa',
};

function texto(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function numero(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function evidencias(value: unknown): Feedback360Evidence[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 3)
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const obj = item as Record<string, unknown>;
      const fonte = texto(obj.fonte);
      const sinal = texto(obj.sinal);
      return fonte && sinal ? { fonte, sinal } : null;
    })
    .filter(Boolean) as Feedback360Evidence[];
}

function padroes(value: unknown): Feedback360Pattern[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 5)
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const obj = item as Record<string, unknown>;
      const tema = texto(obj.tema);
      const leitura = texto(obj.leitura);
      if (!tema || !leitura) return null;
      return {
        tema,
        contagem: Math.max(1, numero(obj.contagem)),
        leitura,
        evidencias: evidencias(obj.evidencias),
      };
    })
    .filter(Boolean) as Feedback360Pattern[];
}

function isoladas(value: unknown): Feedback360Isolated[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 4)
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const obj = item as Record<string, unknown>;
      const tema = texto(obj.tema);
      const fonte = texto(obj.fonte);
      const leitura = texto(obj.leitura);
      return tema && leitura ? { tema, fonte, leitura } : null;
    })
    .filter(Boolean) as Feedback360Isolated[];
}

function pontosCegos(value: unknown): Feedback360BlindSpot[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 3)
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const obj = item as Record<string, unknown>;
      const tema = texto(obj.tema);
      const leitura = texto(obj.leitura);
      const base = texto(obj.base);
      return tema && leitura ? { tema, leitura, base } : null;
    })
    .filter(Boolean) as Feedback360BlindSpot[];
}

function comparacoes(value: unknown): Feedback360SelfExternal[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 4)
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const obj = item as Record<string, unknown>;
      const tema = texto(obj.tema);
      const leitura = texto(obj.leitura);
      const tipo = texto(obj.tipo);
      if (!tema || !leitura) return null;
      const tipoSeguro: Feedback360SelfExternal['tipo'] =
        tipo === 'convergencia' || tipo === 'tensao' ? tipo : 'hipotese';
      return { tema, tipo: tipoSeguro, leitura };
    })
    .filter(Boolean) as Feedback360SelfExternal[];
}

function prioridades(value: unknown): Feedback360PdiPriority[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 2)
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const obj = item as Record<string, unknown>;
      const titulo = texto(obj.titulo);
      const por_que = texto(obj.por_que);
      const acao = texto(obj.acao);
      return titulo && acao ? { titulo, por_que, acao } : null;
    })
    .filter(Boolean) as Feedback360PdiPriority[];
}

function normalizarResumo(value: unknown): Feedback360SummaryData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('A leitura 360 não veio em formato válido.');
  }

  const obj = value as Record<string, unknown>;
  const resumo = texto(obj.resumo);
  if (!resumo) throw new Error('A leitura 360 veio sem resumo.');

  const confianca = texto(obj.confianca_leitura);
  const confianca_leitura: Feedback360SummaryData['confianca_leitura'] =
    confianca === 'alta' || confianca === 'media' ? confianca : 'baixa';

  return {
    resumo,
    forcas_recorrentes: padroes(obj.forcas_recorrentes),
    desenvolvimento_recorrente: padroes(obj.desenvolvimento_recorrente).slice(0, 4),
    percepcoes_isoladas: isoladas(obj.percepcoes_isoladas),
    pontos_cegos: pontosCegos(obj.pontos_cegos),
    autopercepcao_vs_externa: comparacoes(obj.autopercepcao_vs_externa),
    prioridades_pdi: prioridades(obj.prioridades_pdi),
    confianca_leitura,
    observacao_amostra:
      texto(obj.observacao_amostra) ||
      'A leitura deve ser revisitada quando houver novos respondentes ou novas rodadas.',
  };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { roundId?: string } | null;
  const roundId = body?.roundId?.trim();

  if (!roundId) {
    return NextResponse.json({ error: 'Rodada não informada.' }, { status: 400 });
  }

  const { data: rodada, error: roundError } = await supabase
    .from('feedback_360_rounds')
    .select('*')
    .eq('id', roundId)
    .eq('user_id', user.id)
    .single();

  if (roundError || !rodada) {
    return NextResponse.json({ error: 'Rodada não encontrada.' }, { status: 404 });
  }

  const [{ data: perguntas }, { data: respondentes }, { data: respostas }, { data: cache }] =
    await Promise.all([
      supabase
        .from('feedback_360_questions')
        .select('*')
        .eq('round_id', roundId)
        .eq('user_id', user.id)
        .order('ordem'),
      supabase
        .from('feedback_360_respondents')
        .select('*')
        .eq('round_id', roundId)
        .eq('user_id', user.id)
        .order('created_at'),
      supabase
        .from('feedback_360_answers')
        .select('*')
        .eq('round_id', roundId)
        .eq('user_id', user.id),
      supabase
        .from('feedback_360_summaries')
        .select('*')
        .eq('round_id', roundId)
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

  if (
    cache?.status === 'concluida' &&
    cache.resumo_json &&
    cache.source_updated_at &&
    new Date(cache.source_updated_at).getTime() >= new Date(rodada.updated_at).getTime()
  ) {
    return NextResponse.json(
      { resumo: cache.resumo_json, cached: true },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  const perguntasAtuais = perguntas ?? [];
  const respondentesAtuais = respondentes ?? [];
  const respostasAtuais = respostas ?? [];

  const respondentesComResposta = respondentesAtuais.filter((respondente) =>
    respostasAtuais.some(
      (resposta) =>
        resposta.respondent_id === respondente.id && Boolean(resposta.resposta?.trim())
    )
  );

  if (respondentesComResposta.length === 0) {
    return NextResponse.json(
      { error: 'Adicione pelo menos uma pessoa com respostas antes de gerar a leitura.' },
      { status: 400 }
    );
  }

  const [{ data: diagnostics }, { data: via }, { data: resumoPerfil }] = await Promise.all([
    supabase
      .from('diagnostics')
      .select('momento_carreira, objetivos, habilidades, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('via_resultados')
      .select('forcas, data_teste')
      .eq('user_id', user.id)
      .order('data_teste', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('resumo_perfil')
      .select('conteudo_markdown, gerado_em')
      .eq('user_id', user.id)
      .order('gerado_em', { ascending: false })
      .limit(1),
  ]);

  const diagnostico = diagnostics?.[0] ?? null;
  const viaAtual = via?.[0] ?? null;
  const resumoAtual = resumoPerfil?.[0] ?? null;

  const payloadRespondentes = respondentesComResposta.map((respondente, index) => ({
    referencia: `Pessoa ${index + 1}`,
    cargo_funcao: respondente.cargo_funcao,
    empresa_contexto: respondente.empresa_contexto,
    relacao_label:
      respondente.relacao === 'outro' && respondente.relacao_outro
        ? respondente.relacao_outro
        : RELACAO_LABEL[respondente.relacao] || 'outra relação',
    convivencia_label: CONVIVENCIA_LABEL[respondente.convivencia] || 'média',
    respostas: perguntasAtuais
      .map((pergunta) => {
        const resposta = respostasAtuais.find(
          (item) =>
            item.respondent_id === respondente.id && item.question_id === pergunta.id
        );
        return resposta?.resposta?.trim()
          ? { pergunta: pergunta.pergunta, resposta: resposta.resposta.trim() }
          : null;
      })
      .filter(Boolean) as Array<{ pergunta: string; resposta: string }>,
  }));

  const prompt = montarPromptFeedback360({
    rodada: {
      titulo: rodada.titulo,
      objetivo: rodada.objetivo,
    },
    perguntas: perguntasAtuais.map((pergunta) => ({
      id: pergunta.id,
      pergunta: pergunta.pergunta,
    })),
    respondentes: payloadRespondentes,
    autopercepcao: {
      momento_carreira: diagnostico?.momento_carreira,
      objetivos: diagnostico?.objetivos,
      forcas_declaradas: (diagnostico?.habilidades?.forcas as string[]) ?? [],
      via_top5: Array.isArray(viaAtual?.forcas) ? viaAtual.forcas.slice(0, 5) : [],
      resumo_perfil: resumoAtual?.conteudo_markdown ?? null,
    },
  });

  const admin = createAdminClient();

  await admin.from('feedback_360_summaries').upsert(
    {
      round_id: roundId,
      user_id: user.id,
      status: 'pendente',
      erro_analise: null,
      source_updated_at: rodada.updated_at,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'round_id,user_id' }
  );

  try {
    const bruto = await chamarClaudeJson<Record<string, unknown>>(prompt, {
      maxTokens: 3000,
      descricao: 'Percepção 360',
    });

    const resumo = normalizarResumo(bruto);

    const { error: saveError } = await admin.from('feedback_360_summaries').upsert(
      {
        round_id: roundId,
        user_id: user.id,
        resumo_json: resumo,
        status: 'concluida',
        erro_analise: null,
        source_updated_at: rodada.updated_at,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'round_id,user_id' }
    );

    if (saveError) {
      console.error('[FEEDBACK-360] Leitura gerada, mas não salva:', saveError.message);
      return NextResponse.json(
        {
          error:
            'A leitura foi gerada, mas não consegui salvá-la com segurança. Tente novamente para não perder a análise.',
        },
        { status: 500 }
      );
    }

    await admin
      .from('feedback_360_rounds')
      .update({ status: 'concluida' })
      .eq('id', roundId)
      .eq('user_id', user.id);

    return NextResponse.json(
      { resumo, cached: false },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Não foi possível gerar a leitura 360 agora.';

    console.error('[FEEDBACK-360] Falha na análise:', message);

    await admin.from('feedback_360_summaries').upsert(
      {
        round_id: roundId,
        user_id: user.id,
        status: 'erro',
        erro_analise: message.slice(0, 1000),
        source_updated_at: rodada.updated_at,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'round_id,user_id' }
    );

    return NextResponse.json(
      {
        error:
          'Os feedbacks estão salvos, mas a leitura automática falhou agora. Tente novamente em instantes.',
      },
      { status: 500 }
    );
  }
}
