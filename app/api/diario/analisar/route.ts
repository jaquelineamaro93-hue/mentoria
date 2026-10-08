import { NextRequest, NextResponse } from 'next/server';
import { consumeIdentifierRateLimit } from '@/lib/security/rate-limit';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 120;

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
    scope: 'ai_diario_analisar',
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

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Serviço de IA não configurado. Avise o suporte.' },
        { status: 503 }
      );
    }

    const { noteId } = await request.json();
    if (!noteId) {
      return NextResponse.json({ error: 'Registro do diário não informado.' }, { status: 400 });
    }

    const { data: note, error: noteError } = await supabase
      .from('journal_notes')
      .select('id, user_id, encontro_data, tipo_encontro, anotacoes')
      .eq('id', noteId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (noteError || !note) {
      return NextResponse.json({ error: 'Registro do diário não encontrado.' }, { status: 404 });
    }

    const [
      { data: anteriores },
      { data: via },
      { data: bussola },
      { data: pdi },
      { data: cv },
      { data: vagas },
      { data: soar },
    ] = await Promise.all([
      supabase
        .from('journal_notes')
        .select('encontro_data, anotacoes, ai_summary')
        .eq('user_id', user.id)
        .neq('id', note.id)
        .order('encontro_data', { ascending: false })
        .limit(4),
      supabase
        .from('via_resultados')
        .select('forcas, analise_ia, data_teste')
        .eq('user_id', user.id)
        .order('data_teste', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('bussola_posicionamento')
        .select('norte, sul, leste, oeste, centro, gerado_em')
        .eq('user_id', user.id)
        .order('gerado_em', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('pdi_respostas')
        .select('secao, dados, concluido, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false }),
      supabase
        .from('cv_simulacoes')
        .select('resultado_json, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('vagas_candidatura')
        .select('empresa, cargo, etapa, fit_score, pontos_fortes, gaps, proximo_passo, updated_at')
        .eq('mentorado_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(3),
      supabase
        .from('soar_analises')
        .select('titulo, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3),
    ]);

    const pdiTotal = pdi?.length ?? 0;
    const pdiConcluido = pdi?.filter((item) => item.concluido).length ?? 0;
    const cvResultado = cv?.resultado_json as
      | {
          fit_percentual?: number;
          fit_label?: string;
          pontos_fortes?: string[];
          pontos_atencao?: string[];
          palavras_chave_ausentes?: string[];
        }
      | null
      | undefined;

    const contexto = {
      registro_atual: {
        data: note.encontro_data,
        tipo: note.tipo_encontro,
        texto: note.anotacoes,
      },
      registros_anteriores: (anteriores ?? []).map((item) => ({
        data: item.encontro_data,
        texto: item.anotacoes,
        insight_anterior: item.ai_summary,
      })),
      autoconhecimento: {
        forcas_via: via?.forcas ?? [],
        analise_via: via?.analise_ia ?? null,
        bussola: bussola ?? null,
      },
      desenvolvimento: {
        pdi_total_secoes_respondidas: pdiTotal,
        pdi_secoes_concluidas: pdiConcluido,
      },
      carreira: {
        ultimo_cv: cvResultado
          ? {
              fit: cvResultado.fit_percentual ?? null,
              label: cvResultado.fit_label ?? null,
              pontos_fortes: cvResultado.pontos_fortes ?? [],
              pontos_atencao: cvResultado.pontos_atencao ?? [],
              palavras_chave_ausentes: cvResultado.palavras_chave_ausentes ?? [],
            }
          : null,
        candidaturas_recentes: vagas ?? [],
        preparacoes_soar_recentes: soar ?? [],
      },
    };

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = `Você é a inteligência de acompanhamento da Mentoria SOMA.
Sua função é interpretar a evolução do mentorado conectando AUTOCONHECIMENTO e CARREIRA ao longo do tempo.

Use somente os dados fornecidos. Não invente fatos, competências, resultados, emoções ou tendências.
Quando não houver evidência suficiente, diga explicitamente que ainda não há dados para concluir.

DADOS DA JORNADA:
${JSON.stringify(contexto, null, 2)}

Analise o registro atual do Diário de Bordo à luz dos dados anteriores.

Responda SOMENTE com JSON válido, sem markdown externo, neste formato:
{
  "sintese": "2 a 4 frases sobre o principal aprendizado ou mudança perceptível neste registro.",
  "autoconhecimento": "Conexão objetiva com forças, padrões, bússola ou PDI. Se não houver base, diga que ainda faltam dados.",
  "carreira": "Conexão objetiva com candidaturas, aderência a vagas, CV ou preparação de entrevista. Se não houver base, diga que ainda faltam dados.",
  "evolucao": "O que mudou, se repetiu ou ficou mais claro comparando com os registros anteriores. Não force uma evolução se não houver evidência.",
  "proximo_passo": "Uma única ação concreta, pequena e verificável para o próximo ciclo."
}

Tom: humano, direto, cuidadoso e profissional. Português do Brasil.
Não use linguagem clínica. Não faça diagnóstico psicológico.
Não elogie genericamente. Priorize evidência e conexão entre os dados.`;

    const resposta = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1800,
      messages: [{ role: 'user', content: prompt }],
    });

    const texto = resposta.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim()
      .replace(/^\`\`\`json\s*/i, '')
      .replace(/\`\`\`$/i, '')
      .trim();

    let analise: {
      sintese: string;
      autoconhecimento: string;
      carreira: string;
      evolucao: string;
      proximo_passo: string;
    };

    try {
      analise = JSON.parse(texto);
    } catch {
      return NextResponse.json(
        { error: 'A análise não veio no formato esperado. Tente novamente.' },
        { status: 502 }
      );
    }

    const aiSummary = [
      `Síntese: ${analise.sintese}`,
      `Autoconhecimento: ${analise.autoconhecimento}`,
      `Carreira: ${analise.carreira}`,
      `Evolução percebida: ${analise.evolucao}`,
      `Próximo passo: ${analise.proximo_passo}`,
    ].join('\n\n');

    const { error: updateError } = await supabase
      .from('journal_notes')
      .update({ ai_summary: aiSummary })
      .eq('id', note.id)
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json({ error: 'A análise foi gerada, mas não pôde ser salva.' }, { status: 500 });
    }

    return NextResponse.json({ analise, ai_summary: aiSummary });
  } catch (error) {
    console.error('[DIARIO-ANALISAR] Erro:', error);
    return NextResponse.json(
      { error: 'Não foi possível analisar este registro agora.' },
      { status: 500 }
    );
  }
}
