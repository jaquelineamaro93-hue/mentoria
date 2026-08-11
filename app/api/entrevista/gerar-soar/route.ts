import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { curriculo, descricaoVaga } = await request.json();

    if (!curriculo || !descricaoVaga) {
      return NextResponse.json(
        { error: 'Currículo e descrição da vaga são obrigatórios' },
        { status: 400 }
      );
    }

    const prompt = `Você é um especialista em entrevistas corporativas. Analise o currículo e a descrição da vaga usando SOAR (Situation, Obstacle, Action, Result).

CURRÍCULO:
${curriculo}

DESCRIÇÃO DA VAGA:
${descricaoVaga}

Retorne JSON com: experiencias[], mapaCompetencias{}, abertura, historiasAncora[], resposta_por_que_sair, resposta_por_que_vaga, tratamento_gaps`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Resposta inválida');

    const analise = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ analise });
  } catch (erro) {
    console.error('🔴 SOAR Error:', erro);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}
