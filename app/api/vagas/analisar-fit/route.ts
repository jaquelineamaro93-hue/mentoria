import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { descricao_vaga, empresa, cargo } = await request.json();

    if (!descricao_vaga || !empresa || !cargo) {
      return NextResponse.json(
        { error: 'descricao_vaga, empresa e cargo são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar perfil do mentorado para contexto
    const { data: profile } = await supabase
      .from('profiles')
      .select('nome, bio, skills, experiencias, objetivo_carreira')
      .eq('id', user.user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `Você é um especialista em transição de carreira e recrutamento. Analise o fit entre o perfil do mentorado e a vaga de emprego.

PERFIL DO MENTORADO:
- Nome: ${profile.nome}
- Bio: ${profile.bio || 'Não preenchido'}
- Skills: ${profile.skills || 'Não preenchido'}
- Experiências: ${profile.experiencias || 'Não preenchido'}
- Objetivo de Carreira: ${profile.objetivo_carreira || 'Não preenchido'}

VAGA DE EMPREGO:
- Empresa: ${empresa}
- Cargo: ${cargo}
- Descrição: ${descricao_vaga}

Por favor, forneça uma análise estruturada em JSON com os seguintes campos:
{
  "fit_score": <número de 0 a 100>,
  "pontos_fortes": [<lista de 3-5 pontos fortes do mentorado para esta vaga>],
  "gaps": [<lista de 3-5 áreas de melhoria/gaps de conhecimento>],
  "recomendacoes": [<lista de 2-3 recomendações específicas para aumentar o fit>],
  "resumo": "<resumo de 1-2 frases sobre o fit geral>"
}

Retorne APENAS o JSON, sem texto adicional.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Parsear resposta JSON
    let analise;
    try {
      analise = JSON.parse(responseText);
    } catch {
      console.error('Erro ao parsear resposta da IA:', responseText);
      return NextResponse.json(
        { error: 'Erro ao processar análise de fit' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      fit_score: analise.fit_score,
      pontos_fortes: analise.pontos_fortes,
      gaps: analise.gaps,
      recomendacoes: analise.recomendacoes,
      resumo: analise.resumo,
    });
  } catch (error) {
    console.error('🔴 [ANALISAR-FIT] Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}
