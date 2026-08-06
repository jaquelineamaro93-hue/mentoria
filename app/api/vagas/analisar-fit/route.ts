import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user?.user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    const { vaga_input } = await request.json();

    if (!vaga_input) {
      return NextResponse.json({ error: 'vaga_input é obrigatorio' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const cleanedInput = vaga_input.replace(/[^\x00-\xFF]/g, '');

    const prompt = `Voce é um especialista em transicao de carreira. Analise o fit entre o perfil e a vaga.

PERFIL:
Nome: ${profile.nome || 'Usuario'}
Objetivo: ${(profile as any).objetivo_carreira || 'Nao preenchido'}
Skills: ${(profile as any).skills || 'Nao preenchido'}
Experiencias: ${(profile as any).experiencias || 'Nao preenchido'}

VAGA:
${cleanedInput}

Retorne APENAS este JSON (sem markdown):
{
  "fit_score": 0,
  "readiness_score": 0,
  "empresa": "Nao identificada",
  "cargo": "Nao identificado",
  "sub_scores": {"experiencia": 0, "skills_tecnicas": 0, "senioridade": 0, "contexto_setor": 0},
  "pontos_fortes": ["ponto1"],
  "gaps": [{"titulo": "Gap 1", "descricao": "desc", "mitigacao": "como contornar"}],
  "recomendacoes_curriculo": ["rec1"],
  "resumo": "resumo",
  "roadmap_items": [{"tipo": "skill", "titulo": "titulo", "descricao": "desc", "semanas": 2, "prioridade": "high", "recursos": ["recurso"]}]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    let analise;
    try {
      const cleanedText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      analise = JSON.parse(cleanedText);
    } catch (e) {
      console.error('Erro ao parsear:', responseText);
      return NextResponse.json({ error: 'Erro ao processar analise' }, { status: 500 });
    }

    const readiness_score = analise.readiness_score || Math.floor(analise.fit_score * 0.8);
    const weeks_to_ready = (analise.roadmap_items || []).reduce((sum: number, item: any) => sum + (item.semanas || 0), 0) || 8;
    const estimated_readiness_date = new Date();
    estimated_readiness_date.setDate(estimated_readiness_date.getDate() + weeks_to_ready * 7);

    return NextResponse.json({
      fit_score: analise.fit_score,
      readiness_score,
      readiness_gap: 100 - readiness_score,
      weeks_to_ready,
      estimated_readiness_date: estimated_readiness_date.toISOString().split('T')[0],
      empresa: analise.empresa,
      cargo: analise.cargo,
      sub_scores: analise.sub_scores || {},
      pontos_fortes: analise.pontos_fortes || [],
      gaps: analise.gaps || [],
      recomendacoes_curriculo: analise.recomendacoes_curriculo || [],
      resumo: analise.resumo,
      roadmap_items: analise.roadmap_items || [],
    });
  } catch (error) {
    console.error('Erro na analise:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}
