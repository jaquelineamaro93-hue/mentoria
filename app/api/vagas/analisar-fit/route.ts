import { NextRequest, NextResponse } from 'next/server';
import { consumeIdentifierRateLimit } from '@/lib/security/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { chamarClaude } from '@/lib/anthropic';

export const maxDuration = 120;

interface FitAnalysis {
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
  contexto_soma: string;
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
    scope: 'ai_vagas_fit',
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
    const empresa = String(body.empresa ?? '').trim();
    const cargo = String(body.cargo ?? '').trim();
    const descricaoVaga = String(body.descricao_vaga ?? '').trim();

    if (!empresa || !cargo || !descricaoVaga) {
      return NextResponse.json(
        { error: 'Empresa, cargo e descrição da vaga são obrigatórios.' },
        { status: 400 }
      );
    }

    const [
      { data: cvMaisRecente },
      { data: soarMaisRecente },
      { data: resumoPerfil },
      { data: via },
      { data: bussola },
      { data: pdiRespostas },
    ] = await Promise.all([
      supabase
        .from('cv_simulacoes')
        .select('id, curriculo_texto, resultado_json, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('soar_analises')
        .select('curriculo, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('resumo_perfil')
        .select('conteudo_markdown, gerado_em')
        .eq('user_id', user.id)
        .order('gerado_em', { ascending: false })
        .limit(1)
        .maybeSingle(),
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
    ]);

    const curriculoBase = cvMaisRecente?.curriculo_texto?.trim() || soarMaisRecente?.curriculo?.trim();

    if (!curriculoBase) {
      return NextResponse.json(
        {
          error: 'Antes de analisar uma vaga, use o Simulador de CV para registrar seu currículo atual.',
          errorCode: 'MISSING_CV_BASE',
        },
        { status: 409 }
      );
    }

    const pdiTotal = pdiRespostas?.length ?? 0;
    const pdiConcluido = pdiRespostas?.filter((item) => item.concluido).length ?? 0;
    const pdiTextos = (pdiRespostas ?? [])
      .filter((item) => item.concluido && item.dados?.texto)
      .slice(0, 8)
      .map((item) => ({ secao: item.secao, texto: item.dados.texto }));

    const contextoSoma = {
      resumo_perfil: resumoPerfil?.conteudo_markdown ?? null,
      forcas_via: via?.forcas ?? [],
      analise_via: via?.analise_ia ?? null,
      bussola: bussola ?? null,
      pdi: {
        secoes_respondidas: pdiTotal,
        secoes_concluidas: pdiConcluido,
        respostas_recentes: pdiTextos,
      },
    };

    const prompt = `Você é um especialista em recrutamento, ATS e desenvolvimento de carreira da Mentoria SOMA.

Analise a compatibilidade entre o currículo e a vaga abaixo. Use o contexto de autoconhecimento SOMA apenas para PERSONALIZAR recomendações e interpretar direção de carreira — nunca use forças VIA, Bússola ou PDI como prova de experiência técnica que não existe no currículo.

REGRAS DE PRECISÃO:
- O fit deve ser baseado prioritariamente em evidências explícitas do currículo versus requisitos da vaga.
- Diferencie "não atende" de "não há evidência suficiente no currículo".
- Não invente experiência, ferramentas, idiomas, senioridade, resultados ou formação.
- Não aumente o score por afinidade subjetiva, personalidade ou força de caráter.
- Se a vaga não trouxer um requisito, não penalize por ele.
- Seja conservador com o score quando houver pouca evidência.
- Recomendações devem ser executáveis e específicas.

EMPRESA: ${empresa}
CARGO: ${cargo}

DESCRIÇÃO DA VAGA:
${descricaoVaga}

CURRÍCULO BASE MAIS RECENTE:
${curriculoBase}

CONTEXTO SOMA DE AUTOCONHECIMENTO E DESENVOLVIMENTO:
${JSON.stringify(contextoSoma, null, 2)}

Responda SOMENTE com JSON válido:
{
  "fit_score": 0,
  "breakdown_por_categoria": {
    "experiencia": 0,
    "skills_tecnicas": 0,
    "senioridade": 0,
    "contexto_setor": 0
  },
  "pontos_fortes": ["..."],
  "gaps": ["..."],
  "recomendacoes": ["..."],
  "palavras_chave_ats": ["..."],
  "resumo": "2 a 4 frases com leitura objetiva do fit.",
  "contexto_soma": "1 a 3 frases conectando forças/bússola/PDI com a decisão de carreira sem confundir isso com aderência técnica."
}

Todos os scores devem ser inteiros entre 0 e 100. Português do Brasil.`;

    const respostaTexto = await chamarClaude(prompt, 3500);
    const textoJson = respostaTexto
      .replace(/^\`\`\`json\s*/i, '')
      .replace(/\`\`\`$/i, '')
      .trim();

    let analise: FitAnalysis;
    try {
      analise = JSON.parse(textoJson);
    } catch {
      return NextResponse.json(
        { error: 'A análise não veio no formato esperado. Tente novamente.' },
        { status: 502 }
      );
    }

    const clamp = (value: unknown) =>
      Math.max(0, Math.min(100, Number.isFinite(Number(value)) ? Math.round(Number(value)) : 0));

    analise.fit_score = clamp(analise.fit_score);
    analise.breakdown_por_categoria = {
      experiencia: clamp(analise.breakdown_por_categoria?.experiencia),
      skills_tecnicas: clamp(analise.breakdown_por_categoria?.skills_tecnicas),
      senioridade: clamp(analise.breakdown_por_categoria?.senioridade),
      contexto_setor: clamp(analise.breakdown_por_categoria?.contexto_setor),
    };

    return NextResponse.json({ ...analise, source_cv_simulacao_id: cvMaisRecente?.id ?? null });
  } catch (error) {
    console.error('[VAGAS-ANALISAR-FIT] Erro:', error);
    return NextResponse.json(
      { error: 'Não foi possível analisar a compatibilidade agora.' },
      { status: 500 }
    );
  }
}
