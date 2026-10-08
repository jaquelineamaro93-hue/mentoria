import { NextResponse } from 'next/server';
import { consumeIdentifierRateLimit } from '@/lib/security/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { chamarClaudeJson } from '@/lib/ai-json';
import { VIA_FORCAS } from '@/lib/prompts';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const aiAllowed = await consumeIdentifierRateLimit({
    scope: 'ai_extrair_via',
    identifier: user.id,
    limit: 30,
    windowSeconds: 60 * 60,
  });

  if (!aiAllowed) {
    return NextResponse.json(
      { error: 'Limite temporário atingido. Tente novamente mais tarde.' },
      { status: 429 }
    );
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
    const parsed = await chamarClaudeJson<{ forcas: string[] }>(prompt, {
      maxTokens: 2500,
      descricao: 'extração do VIA em PDF',
      validar: (valor): valor is { forcas: string[] } => {
        if (!valor || typeof valor !== 'object') return false;
        const forcas = (valor as { forcas?: unknown }).forcas;
        return (
          Array.isArray(forcas) &&
          forcas.length === 24 &&
          forcas.every((forca) => typeof forca === 'string' && VIA_FORCAS.includes(forca as (typeof VIA_FORCAS)[number]))
        );
      },
    });

    return NextResponse.json({ forcas: parsed.forcas });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
