import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { vaga_input } = await request.json();

    if (!vaga_input) {
      return NextResponse.json({ error: 'vaga_input é obrigatório' }, { status: 400 });
    }

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .limit(1);

    const profile = profiles && profiles.length > 0 ? profiles[0] : null;

    if (profileError) {
      console.warn('⚠️  Erro ao buscar perfil:', profileError);
    }

    const { data: pdiPlano } = await supabase
      .from('pdi_planos')
      .select('diagnostico, equacao, pilares')
      .eq('mentorado_id', user.user.id)
      .eq('status', 'ativo')
      .order('gerado_em', { ascending: false })
      .limit(1)
      .single();

    const nome = profile?.nome || 'Usuário';
    const objetivo = profile?.objetivo_carreira || 'Não preenchido';
    const skills = profile?.skills || profile?.skill || 'Não preenchido';
    const experiencias = profile?.experiencias || profile?.experiencia || 'Não preenchido';
    const diagnostico = pdiPlano?.diagnostico || {};

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `Você é um especialista em transição de carreira. Analise o fit entre PDI/perfil do mentorado e a vaga.

PERFIL (PDI + Diagnóstico):
- Nome: ${nome}
- Objetivo: ${objetivo}
- Equação PDI: ${pdiPlano?.equacao || 'Não preenchido'}
- Diagnóstico: ${JSON.stringify(diagnostico).substring(0, 200)}
- Skills: ${skills}
- Experiências: ${experiencias}

VAGA:
${vaga_input}

Retorne APENAS este JSON (sem markdown, sem backticks):
{
  "fit_score": <0-100>,
  "readiness_score": <0-100>,
  "empresa": "<extraído ou 'Não identificada'>",
  "cargo": "<extraído ou 'Não identificado'>",
  "sub_scores": {"experiencia": <0-100>, "skills_tecnicas": <0-100>, "senioridade": <0-100>, "contexto_setor": <0-100>},
  "pontos_fortes": ["ponto1", "ponto2", "ponto3"],
  "gaps": [{"titulo": "Gap 1", "descricao": "...", "mitigacao": "como contornar na entrevista"}],
  "recomendacoes_curriculo": ["rec1", "rec2"],
  "resumo": "1-2 frases",
  "roadmap_items": [{"tipo": "skill|project|course", "titulo": "...", "descricao": "...", "semanas": 2, "prioridade": "high|medium|low", "recursos": ["..."]}]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    let analise;
    try {
      analise = JSON.parse(responseText);
    } catch {
      console.error('Erro ao parsear:', responseText);
      return NextResponse.json({ error: 'Erro ao processar análise de fit' }, { status: 500 });
    }

    const readiness_score = analise.readiness_score || Math.floor(analise.fit_score * 0.8);
    const readiness_gap = 100 - readiness_score;
    const weeks_to_ready = (analise.roadmap_items || []).reduce((sum: number, item: any) => sum + (item.semanas || 0), 0) || 8;

    const estimated_readiness_date = new Date();
    estimated_readiness_date.setDate(estimated_readiness_date.getDate() + weeks_to_ready * 7);

    return NextResponse.json({
      fit_score: analise.fit_score,
      readiness_score,
      readiness_gap,
      weeks_to_ready,
      estimated_readiness_date: estimated_readiness_date.toISOString().split('T')[0],
      empresa: analise.empresa,
      cargo: analise.cargo,
      sub_scores: analise.sub_scores || { experiencia: 0, skills_tecnicas: 0, senioridade: 0, contexto_setor: 0 },
      pontos_fortes: analise.pontos_fortes || [],
      gaps: analise.gaps || [],
      recomendacoes_curriculo: analise.recomendacoes_curriculo || [],
      resumo: analise.resumo,
      roadmap_items: analise.roadmap_items || [],
    });
  } catch (error) {
    console.error('🔴 [ANALISAR-FIT] Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}
