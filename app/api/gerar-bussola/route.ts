import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chamarClaude } from '@/lib/anthropic';
import { montarPromptBussola } from '@/lib/prompts';

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

  if (!respostasRaw || respostasRaw.length < 9) {
    return NextResponse.json(
      { error: 'Responda todos os 9 blocos antes de gerar a bússola.' },
      { status: 400 }
    );
  }

  const respostas: Record<string, string> = {};
  for (const r of respostasRaw) {
    respostas[r.bloco] = r.resposta;
  }

  try {
    const prompt = montarPromptBussola(respostas);
    const textoJson = await chamarClaude(prompt);

    const limpo = textoJson.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(limpo);

    const { data: bussola, error } = await supabase
      .from('bussola_posicionamento')
      .insert({
        user_id: user.id,
        norte: parsed.norte,
        sul: parsed.sul,
        leste: parsed.leste,
        oeste: parsed.oeste,
        centro: parsed.centro,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ bussola });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
