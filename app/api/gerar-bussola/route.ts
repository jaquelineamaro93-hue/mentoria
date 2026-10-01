import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chamarClaudeJson } from '@/lib/ai-json';
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
    const parsed = await chamarClaudeJson<{
      norte: string;
      sul: string;
      leste: string;
      oeste: string;
      centro: string;
    }>(prompt, {
      maxTokens: 3000,
      descricao: 'bússola de posicionamento',
      validar: (valor): valor is {
        norte: string;
        sul: string;
        leste: string;
        oeste: string;
        centro: string;
      } => {
        if (!valor || typeof valor !== 'object') return false;
        const obj = valor as Record<string, unknown>;
        return ['norte', 'sul', 'leste', 'oeste', 'centro'].every(
          (chave) => typeof obj[chave] === 'string' && String(obj[chave]).trim().length > 0
        );
      },
    });

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
