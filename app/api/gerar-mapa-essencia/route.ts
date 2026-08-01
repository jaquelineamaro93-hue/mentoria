import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chamarClaude } from '@/lib/anthropic';
import { montarPromptMapaEssencia } from '@/lib/prompts';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { data: respostasRaw } = await supabase
    .from('quem_sou_eu_respostas')
    .select('bloco, resposta')
    .eq('user_id', user.id);

  if (!respostasRaw || respostasRaw.length < 9) {
    return NextResponse.json(
      { error: 'Responda todos os 9 blocos antes de gerar o mapa.' },
      { status: 400 }
    );
  }

  const respostas: Record<string, string> = {};
  for (const r of respostasRaw) {
    respostas[r.bloco] = r.resposta;
  }

  try {
    const prompt = montarPromptMapaEssencia(respostas);
    const conteudo = await chamarClaude(prompt);

    const { data: mapa, error } = await supabase
      .from('mapa_essencia')
      .insert({ user_id: user.id, conteudo_markdown: conteudo })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ mapa });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
