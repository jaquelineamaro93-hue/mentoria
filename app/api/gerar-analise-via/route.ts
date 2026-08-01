import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chamarClaude } from '@/lib/anthropic';
import { montarPromptAnaliseVia } from '@/lib/prompts';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const body = await request.json();
  const forcas: string[] = body.forcas;
  const dataTeste: string = body.data_teste;

  if (!Array.isArray(forcas) || forcas.length !== 24) {
    return NextResponse.json(
      { error: 'É preciso informar as 24 forças em ordem.' },
      { status: 400 }
    );
  }

  try {
    const prompt = montarPromptAnaliseVia(forcas);
    const analise = await chamarClaude(prompt);

    const { data: resultado, error } = await supabase
      .from('via_resultados')
      .insert({
        user_id: user.id,
        forcas,
        data_teste: dataTeste,
        analise_ia: analise,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ resultado });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
