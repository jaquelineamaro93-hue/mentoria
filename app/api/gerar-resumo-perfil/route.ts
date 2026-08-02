import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chamarClaude } from '@/lib/anthropic';
import { montarPromptResumoPerfil } from '@/lib/prompts';

export async function POST() {
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

  const quemSouEu: Record<string, string> = {};
  (respostasRaw ?? []).forEach((r) => {
    quemSouEu[r.bloco] = r.resposta;
  });

  const { data: diagnosticos } = await supabase
    .from('diagnostics')
    .select('momento_carreira, objetivos, habilidades')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  const diagnostico = diagnosticos?.[0]
    ? {
        momento_carreira: diagnosticos[0].momento_carreira,
        objetivos: diagnosticos[0].objetivos,
        forcas: (diagnosticos[0].habilidades?.forcas as string[]) ?? [],
      }
    : null;

  const { data: viaResultados } = await supabase
    .from('via_resultados')
    .select('forcas, analise_ia')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  const via = viaResultados?.[0]
    ? { forcas: viaResultados[0].forcas as string[], analise: viaResultados[0].analise_ia }
    : null;

  if (Object.keys(quemSouEu).length === 0 && !diagnostico && !via) {
    return NextResponse.json(
      { error: 'Preencha ao menos o Mapa Quem Sou Eu, o Diagnóstico ou o VIA antes de gerar o resumo.' },
      { status: 400 }
    );
  }

  try {
    const prompt = montarPromptResumoPerfil({ quemSouEu, diagnostico, via });
    const conteudo = await chamarClaude(prompt);

    const { data: resumo, error } = await supabase
      .from('resumo_perfil')
      .insert({ user_id: user.id, conteudo_markdown: conteudo })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ resumo });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
