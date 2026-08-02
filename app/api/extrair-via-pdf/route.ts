import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chamarClaude } from '@/lib/anthropic';
import { VIA_FORCAS } from '@/lib/prompts';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const body = await request.json();
  const textoExtraido: string = body.texto;

  if (!textoExtraido || textoExtraido.trim().length < 50) {
    return NextResponse.json(
      { error: 'Não consegui ler texto suficiente desse PDF. Tente digitar manualmente.' },
      { status: 400 }
    );
  }

  const prompt = `O texto abaixo veio de um relatório em PDF do teste VIA Character Strengths (viacharacter.org). Extraia a ordem das 24 forças de caráter, da 1ª (mais natural) à 24ª (mais escondida).

Use exatamente estes nomes em português, traduzindo se o PDF estiver em inglês:
${VIA_FORCAS.join(', ')}

Responda em formato JSON estrito, sem markdown ao redor, como um array de exatamente 24 strings, nesta chave: {"forcas": ["...", "...", ...]}

TEXTO DO PDF:
${textoExtraido.slice(0, 6000)}`;

  try {
    const resposta = await chamarClaude(prompt);
    const limpo = resposta.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(limpo);

    if (!Array.isArray(parsed.forcas) || parsed.forcas.length !== 24) {
      throw new Error('A IA não conseguiu extrair as 24 forças com confiança. Tente digitar manualmente.');
    }

    return NextResponse.json({ forcas: parsed.forcas });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
