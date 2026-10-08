import { NextRequest, NextResponse } from 'next/server';
import { consumeIdentifierRateLimit } from '@/lib/security/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { chamarClaude } from '@/lib/anthropic';

export const maxDuration = 120;

type Pergunta = {
  id: string;
  tipo: string;
  pergunta: string;
  objetivo: string;
};

type Feedback = {
  pergunta_id: string;
  score: number;
  pontos_fortes: string[];
  melhorias: string[];
  alerta_evidencia: string | null;
  resposta_reformulada: string;
};

function extrairJson(texto: string) {
  return texto
    .trim()
    .replace(/^\`\`\`json\s*/i, '')
    .replace(/\`\`\`$/i, '')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

  const aiAllowed = await consumeIdentifierRateLimit({
    scope: 'ai_entrevista_simular',
    identifier: user.id,
    limit: 30,
    windowSeconds: 60 * 60,
  });

  if (!aiAllowed) {
    return NextResponse.json(
      { error: 'Limite temporário atingido. Tente novamente mais tarde.' },
      { status: 429 }
    );
  }

    const body = await request.json();
    const action = body.action;

    if (action === 'start') {
      const curriculo = String(body.curriculo ?? '').trim();
      const descricaoVaga = String(body.descricaoVaga ?? '').trim();
      const candidaturaId = body.candidaturaId ? String(body.candidaturaId) : null;

      if (!curriculo || !descricaoVaga) {
        return NextResponse.json(
          { error: 'Currículo e descrição da vaga são obrigatórios para iniciar a simulação.' },
          { status: 400 }
        );
      }

      if (candidaturaId) {
        const { data: candidatura } = await supabase
          .from('vagas_candidatura')
          .select('id')
          .eq('id', candidaturaId)
          .eq('mentorado_id', user.id)
          .maybeSingle();

        if (!candidatura) {
          return NextResponse.json(
            { error: 'A candidatura selecionada não foi encontrada.' },
            { status: 404 }
          );
        }
      }

      const [
        { data: via },
        { data: bussola },
        { data: resumoPerfil },
        { data: pdi },
      ] = await Promise.all([
        supabase
          .from('via_resultados')
          .select('forcas, analise_ia')
          .eq('user_id', user.id)
          .order('data_teste', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('bussola_posicionamento')
          .select('norte, sul, leste, oeste, centro')
          .eq('user_id', user.id)
          .order('gerado_em', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('resumo_perfil')
          .select('conteudo_markdown')
          .eq('user_id', user.id)
          .order('gerado_em', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('pdi_respostas')
          .select('secao, dados')
          .eq('user_id', user.id)
          .eq('concluido', true)
          .order('updated_at', { ascending: false })
          .limit(6),
      ]);

      const contextoSoma = {
        resumo_perfil: resumoPerfil?.conteudo_markdown ?? null,
        forcas_via: via?.forcas ?? [],
        analise_via: via?.analise_ia ?? null,
        bussola: bussola ?? null,
        pdi: (pdi ?? []).map((item) => ({
          secao: item.secao,
          texto: item.dados?.texto ?? null,
        })),
      };

      const prompt = `Você é uma recrutadora experiente conduzindo uma entrevista simulada para a Mentoria SOMA.

Crie EXATAMENTE 5 perguntas de entrevista para a vaga abaixo, em ordem realista de entrevista:
1. abertura/apresentação;
2. experiência diretamente relacionada à vaga;
3. situação desafiadora ou comportamental;
4. gap, requisito ou ponto de atenção da vaga;
5. motivação, tomada de decisão ou fechamento.

REGRAS:
- Baseie as perguntas na vaga e no currículo.
- O contexto SOMA serve para personalizar temas e motivadores, mas NÃO prova experiência profissional.
- Não invente ferramentas, resultados, cargos ou experiências.
- Faça perguntas abertas, naturais e específicas.
- Não entregue a resposta ideal junto da pergunta.

CURRÍCULO:
${curriculo}

VAGA:
${descricaoVaga}

CONTEXTO SOMA:
${JSON.stringify(contextoSoma, null, 2)}

Responda SOMENTE com JSON válido:
{
  "titulo": "Simulação para [cargo/empresa quando identificável]",
  "perguntas": [
    {
      "id": "q1",
      "tipo": "abertura",
      "pergunta": "texto",
      "objetivo": "o que essa pergunta pretende avaliar"
    }
  ]
}`;

      const texto = await chamarClaude(prompt, 2400);
      let gerado: { titulo?: string; perguntas?: Pergunta[] };

      try {
        gerado = JSON.parse(extrairJson(texto));
      } catch {
        return NextResponse.json(
          { error: 'Não consegui montar as perguntas da simulação. Tente novamente.' },
          { status: 502 }
        );
      }

      const perguntas = Array.isArray(gerado.perguntas) ? gerado.perguntas.slice(0, 5) : [];
      if (perguntas.length !== 5) {
        return NextResponse.json(
          { error: 'A simulação não retornou as 5 perguntas esperadas. Tente novamente.' },
          { status: 502 }
        );
      }

      const { data: simulacao, error: erroSalvar } = await supabase
        .from('entrevista_simulacoes')
        .insert({
          user_id: user.id,
          candidatura_id: candidaturaId,
          titulo: gerado.titulo ?? 'Simulação de entrevista',
          perguntas,
          respostas: [],
          feedbacks: [],
          curriculo,
          descricao_vaga: descricaoVaga,
          status: 'em_andamento',
        })
        .select('id, titulo, perguntas, created_at')
        .single();

      if (erroSalvar || !simulacao) {
        return NextResponse.json(
          { error: 'As perguntas foram geradas, mas não consegui iniciar a simulação.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ simulacao });
    }

    if (action === 'answer') {
      const simulacaoId = String(body.simulacaoId ?? '');
      const pergunta = body.pergunta as Pergunta | undefined;
      const resposta = String(body.resposta ?? '').trim();

      if (!simulacaoId || !pergunta?.id || !resposta) {
        return NextResponse.json(
          { error: 'Pergunta e resposta são obrigatórias.' },
          { status: 400 }
        );
      }

      const { data: simulacao, error: erroBusca } = await supabase
        .from('entrevista_simulacoes')
        .select('id, curriculo, descricao_vaga, perguntas, respostas, feedbacks')
        .eq('id', simulacaoId)
        .eq('user_id', user.id)
        .single();

      if (erroBusca || !simulacao) {
        return NextResponse.json({ error: 'Simulação não encontrada.' }, { status: 404 });
      }

      const perguntasSalvas = Array.isArray(simulacao.perguntas) ? simulacao.perguntas as Pergunta[] : [];
      const perguntaSalva = perguntasSalvas.find((item) => item.id === pergunta.id);

      if (!perguntaSalva) {
        return NextResponse.json(
          { error: 'Essa pergunta não pertence à simulação atual.' },
          { status: 400 }
        );
      }

      const prompt = `Você é uma recrutadora avaliando uma resposta de entrevista em uma simulação da Mentoria SOMA.

PERGUNTA:
${perguntaSalva.pergunta}

OBJETIVO DA PERGUNTA:
${perguntaSalva.objetivo}

RESPOSTA DA PESSOA:
${resposta}

CURRÍCULO DA PESSOA:
${simulacao.curriculo ?? ''}

DESCRIÇÃO DA VAGA:
${simulacao.descricao_vaga ?? ''}

Avalie a RESPOSTA dada, não a pessoa.

Critérios:
- clareza e objetividade;
- aderência à pergunta;
- uso de evidências concretas;
- estrutura da narrativa;
- conexão com a vaga;
- naturalidade da fala.

REGRA DE EVIDÊNCIA:
- Se a resposta trouxer experiência, métrica, ferramenta ou responsabilidade que não aparece no currículo, sinalize no campo alerta_evidencia.
- Não acuse mentira; diga apenas que a informação precisa ser confirmada antes de ser usada.
- A resposta reformulada só pode reorganizar ou tornar mais clara a resposta da pessoa e fatos presentes no currículo. Não invente nada.

Responda SOMENTE com JSON válido:
{
  "score": 0,
  "pontos_fortes": ["..."],
  "melhorias": ["..."],
  "alerta_evidencia": null,
  "resposta_reformulada": "uma versão mais forte, natural e concisa em primeira pessoa"
}`;

      const texto = await chamarClaude(prompt, 1800);
      let avaliacao: Omit<Feedback, 'pergunta_id'>;

      try {
        avaliacao = JSON.parse(extrairJson(texto));
      } catch {
        return NextResponse.json(
          { error: 'Não consegui avaliar essa resposta. Tente novamente.' },
          { status: 502 }
        );
      }

      const feedback: Feedback = {
        pergunta_id: perguntaSalva.id,
        score: Math.max(0, Math.min(100, Math.round(Number(avaliacao.score) || 0))),
        pontos_fortes: Array.isArray(avaliacao.pontos_fortes) ? avaliacao.pontos_fortes : [],
        melhorias: Array.isArray(avaliacao.melhorias) ? avaliacao.melhorias : [],
        alerta_evidencia: avaliacao.alerta_evidencia || null,
        resposta_reformulada: String(avaliacao.resposta_reformulada ?? ''),
      };

      const respostasAtuais = Array.isArray(simulacao.respostas) ? simulacao.respostas : [];
      const feedbacksAtuais = Array.isArray(simulacao.feedbacks) ? simulacao.feedbacks : [];

      const novasRespostas = [
        ...respostasAtuais.filter((item: any) => item.pergunta_id !== pergunta.id),
        { pergunta_id: pergunta.id, resposta },
      ];
      const novosFeedbacks = [
        ...feedbacksAtuais.filter((item: any) => item.pergunta_id !== pergunta.id),
        feedback,
      ];

      const { error: erroAtualizar } = await supabase
        .from('entrevista_simulacoes')
        .update({
          respostas: novasRespostas,
          feedbacks: novosFeedbacks,
          updated_at: new Date().toISOString(),
        })
        .eq('id', simulacaoId)
        .eq('user_id', user.id);

      if (erroAtualizar) {
        return NextResponse.json(
          { error: 'O feedback foi gerado, mas não consegui salvar o progresso.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ feedback });
    }

    if (action === 'finish') {
      const simulacaoId = String(body.simulacaoId ?? '');

      if (!simulacaoId) {
        return NextResponse.json({ error: 'Simulação não informada.' }, { status: 400 });
      }

      const { data: simulacao, error: erroBusca } = await supabase
        .from('entrevista_simulacoes')
        .select('id, titulo, perguntas, respostas, feedbacks, curriculo, descricao_vaga')
        .eq('id', simulacaoId)
        .eq('user_id', user.id)
        .single();

      if (erroBusca || !simulacao) {
        return NextResponse.json({ error: 'Simulação não encontrada.' }, { status: 404 });
      }

      const perguntas = Array.isArray(simulacao.perguntas) ? simulacao.perguntas : [];
      const feedbacks = Array.isArray(simulacao.feedbacks) ? simulacao.feedbacks : [];

      if (feedbacks.length < perguntas.length) {
        return NextResponse.json(
          { error: 'Responda todas as perguntas antes de concluir a simulação.' },
          { status: 400 }
        );
      }

      const scores = feedbacks
        .map((item: any) => Number(item.score))
        .filter((score: number) => Number.isFinite(score));

      const scoreFinal = scores.length
        ? Math.round(scores.reduce((soma: number, score: number) => soma + score, 0) / scores.length)
        : 0;

      const prompt = `Você está encerrando uma simulação de entrevista da Mentoria SOMA.

Com base somente nas perguntas, respostas e feedbacks abaixo, produza uma síntese final prática.

DADOS:
${JSON.stringify(
        {
          perguntas: simulacao.perguntas,
          respostas: simulacao.respostas,
          feedbacks: simulacao.feedbacks,
        },
        null,
        2
      )}

Responda SOMENTE com JSON válido:
{
  "score_final": ${scoreFinal},
  "leitura_geral": "2 a 4 frases",
  "forcas_recorrentes": ["..."],
  "prioridades_de_melhoria": ["..."],
  "proxima_pratica": "uma ação específica para a próxima simulação"
}`;

      const texto = await chamarClaude(prompt, 1600);
      let resumoFinal: Record<string, unknown>;

      try {
        resumoFinal = JSON.parse(extrairJson(texto));
      } catch {
        resumoFinal = {
          score_final: scoreFinal,
          leitura_geral: 'Simulação concluída.',
          forcas_recorrentes: [],
          prioridades_de_melhoria: [],
          proxima_pratica: 'Revise seus feedbacks antes da próxima simulação.',
        };
      }

      resumoFinal.score_final = scoreFinal;

      const { error: erroAtualizar } = await supabase
        .from('entrevista_simulacoes')
        .update({
          status: 'concluida',
          score_final: scoreFinal,
          resumo_final: resumoFinal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', simulacaoId)
        .eq('user_id', user.id);

      if (erroAtualizar) {
        return NextResponse.json(
          { error: 'A simulação terminou, mas não consegui salvar o resumo final.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ resumo: resumoFinal });
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (error) {
    console.error('[ENTREVISTA-SIMULAR] Erro:', error);
    return NextResponse.json(
      { error: 'Não foi possível processar a simulação agora.' },
      { status: 500 }
    );
  }
}
