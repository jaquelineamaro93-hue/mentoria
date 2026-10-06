import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chamarClaudeJson } from '@/lib/ai-json';
import { montarPromptEvolucaoVia } from '@/lib/prompts';
import type { ViaEvolucaoAnalise } from '@/lib/types';

export const dynamic = 'force-dynamic';

function validarAnalise(valor: unknown): valor is ViaEvolucaoAnalise {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return false;
  const item = valor as Record<string, unknown>;

  return (
    typeof item.resumo === 'string' &&
    typeof item.assinatura_agora === 'string' &&
    typeof item.suporte_e_equilibrio === 'string' &&
    typeof item.contrastes_e_pontos_cegos === 'string' &&
    typeof item.alavancagem_profissional === 'string' &&
    Array.isArray(item.movimentos_chave) &&
    item.movimentos_chave.length >= 3 &&
    item.movimentos_chave.length <= 5 &&
    item.movimentos_chave.every((movimento) => {
      if (!movimento || typeof movimento !== 'object' || Array.isArray(movimento)) return false;
      const m = movimento as Record<string, unknown>;
      return (
        typeof m.forca === 'string' &&
        typeof m.posicao_anterior === 'number' &&
        typeof m.posicao_atual === 'number' &&
        typeof m.leitura === 'string'
      );
    }) &&
    Array.isArray(item.acoes) &&
    item.acoes.length === 2 &&
    item.acoes.every((acao) => typeof acao === 'string')
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { resultadoAtualId?: string; resultadoAnteriorId?: string }
    | null;

  const resultadoAtualId = body?.resultadoAtualId?.trim();
  const resultadoAnteriorId = body?.resultadoAnteriorId?.trim();

  if (!resultadoAtualId || !resultadoAnteriorId || resultadoAtualId === resultadoAnteriorId) {
    return NextResponse.json(
      { error: 'Selecione duas medições VIA diferentes para comparar.' },
      { status: 400 }
    );
  }

  const { data: cache } = await supabase
    .from('via_evolucao_analises')
    .select('analise_json')
    .eq('user_id', user.id)
    .eq('resultado_atual_id', resultadoAtualId)
    .eq('resultado_anterior_id', resultadoAnteriorId)
    .maybeSingle();

  if (cache?.analise_json && validarAnalise(cache.analise_json)) {
    return NextResponse.json(
      { analise: cache.analise_json, cached: true },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  const { data: resultados, error: resultadosError } = await supabase
    .from('via_resultados')
    .select('id, forcas')
    .eq('user_id', user.id)
    .in('id', [resultadoAtualId, resultadoAnteriorId]);

  if (resultadosError) {
    console.error('[EVOLUCAO-VIA] Falha ao carregar resultados:', resultadosError.message);
    return NextResponse.json(
      { error: 'Não foi possível carregar as medições VIA.' },
      { status: 500 }
    );
  }

  const atual = resultados?.find((item) => item.id === resultadoAtualId);
  const anterior = resultados?.find((item) => item.id === resultadoAnteriorId);

  if (
    !atual ||
    !anterior ||
    !Array.isArray(atual.forcas) ||
    !Array.isArray(anterior.forcas) ||
    atual.forcas.length !== 24 ||
    anterior.forcas.length !== 24
  ) {
    return NextResponse.json(
      { error: 'As duas medições precisam ter as 24 forças completas.' },
      { status: 400 }
    );
  }

  try {
    const prompt = montarPromptEvolucaoVia(
      anterior.forcas as string[],
      atual.forcas as string[]
    );

    const analise = await chamarClaudeJson<ViaEvolucaoAnalise>(prompt, {
      maxTokens: 2400,
      descricao: 'evolução comparativa VIA',
      validar: validarAnalise,
    });

    const { error: cacheError } = await supabase.from('via_evolucao_analises').insert({
      user_id: user.id,
      resultado_anterior_id: resultadoAnteriorId,
      resultado_atual_id: resultadoAtualId,
      analise_json: analise,
    });

    if (cacheError && cacheError.code !== '23505') {
      console.warn('[EVOLUCAO-VIA] Análise gerada, mas cache não foi salvo:', cacheError.message);
    }

    return NextResponse.json(
      { analise, cached: false },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    console.error('[EVOLUCAO-VIA] Falha na análise:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Não foi possível gerar a leitura da evolução agora.',
      },
      { status: 500 }
    );
  }
}
