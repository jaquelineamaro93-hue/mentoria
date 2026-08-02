import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chamarClaude } from '@/lib/anthropic';
import { montarPromptSimuladorCV } from '@/lib/prompts';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const body = await request.json();
  const curriculo: string = body.curriculo?.trim();
  const vaga: string = body.vaga?.trim();

  if (!curriculo || !vaga) {
    return NextResponse.json(
      { error: 'Cole o currículo e a descrição da vaga antes de analisar.' },
      { status: 400 }
    );
  }

  try {
    const prompt = montarPromptSimuladorCV(curriculo, vaga);
    const resultado = await chamarClaude(prompt, 4000);

    const { data: simulacao, error } = await supabase
      .from('cv_simulacoes')
      .insert({
        user_id: user.id,
        curriculo_texto: curriculo,
        vaga_texto: vaga,
        resultado_markdown: resultado,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ simulacao });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
