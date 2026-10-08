import { NextRequest, NextResponse } from 'next/server';
import { consumeIdentifierRateLimit } from '@/lib/security/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { chamarClaude } from '@/lib/anthropic';
import { chamarClaudeJson } from '@/lib/ai-json';
import { montarPromptEvolucaoVia } from '@/lib/prompts';
import type { ViaEvolucaoAnalise, ViaEvolucaoMovimento } from '@/lib/types';

export const dynamic = 'force-dynamic';

type RankingRow = {
  id: string;
  forcas: string[];
};

type MovimentoCalculado = {
  forca: string;
  posicao_anterior: number;
  posicao_atual: number;
  delta: number;
  score: number;
};

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

function numero(valor: unknown): number | null {
  if (typeof valor === 'number' && Number.isFinite(valor)) return valor;
  if (typeof valor === 'string') {
    const match = valor.match(/\d+/);
    if (match) return Number(match[0]);
  }
  return null;
}

function calcularMovimentos(anterior: string[], atual: string[]): MovimentoCalculado[] {
  const posicaoAnterior = new Map(anterior.map((forca, i) => [forca, i + 1]));

  return atual
    .map((forca, i) => {
      const posicao_atual = i + 1;
      const posicao_anterior = posicaoAnterior.get(forca) ?? posicao_atual;
      const delta = posicao_anterior - posicao_atual;
      const mudouAssinatura =
        (posicao_anterior <= 5 && posicao_atual > 5) ||
        (posicao_anterior > 5 && posicao_atual <= 5);

      return {
        forca,
        posicao_anterior,
        posicao_atual,
        delta,
        score: Math.abs(delta) + (mudouAssinatura ? 20 : 0),
      };
    })
    .sort((a, b) => b.score - a.score || Math.abs(b.delta) - Math.abs(a.delta));
}

function leituraMovimento(m: MovimentoCalculado): string {
  if (m.posicao_anterior > 5 && m.posicao_atual <= 5) {
    return `Entrou no Top 5 e passou a compor suas forças de assinatura nesta medição. Vale observar em quais situações essa força apareceu com mais naturalidade.`;
  }

  if (m.posicao_anterior <= 5 && m.posicao_atual > 5) {
    return `Saiu do Top 5, mas continua no seu repertório. A mudança não significa perda da força, apenas que outras ficaram mais salientes agora.`;
  }

  if (m.delta > 0) {
    return `Ganhou espaço relativo no ranking. Isso pode indicar maior disponibilidade dessa força no momento atual, sem significar que ela tenha surgido agora.`;
  }

  if (m.delta < 0) {
    return `Perdeu espaço relativo no ranking. Isso não indica perda de capacidade, apenas uma mudança de prioridade em relação às outras forças.`;
  }

  return 'Manteve a mesma posição entre as duas medições.';
}

function fallbackAnalise(anterior: string[], atual: string[]): ViaEvolucaoAnalise {
  const movimentos = calcularMovimentos(anterior, atual);
  const assinaturaAnterior = anterior.slice(0, 5);
  const assinaturaAtual = atual.slice(0, 5);
  const entraram = assinaturaAtual.filter((forca) => !assinaturaAnterior.includes(forca));
  const sairam = assinaturaAnterior.filter((forca) => !assinaturaAtual.includes(forca));
  const suporte = atual.slice(5, 18);
  const menores = atual.slice(18, 24);

  const movimentos_chave: ViaEvolucaoMovimento[] = movimentos.slice(0, 4).map((m) => ({
    forca: m.forca,
    posicao_anterior: m.posicao_anterior,
    posicao_atual: m.posicao_atual,
    leitura: leituraMovimento(m),
  }));

  return {
    resumo:
      entraram.length > 0 || sairam.length > 0
        ? `Sua configuração de forças mudou entre as duas aplicações. ${entraram.length ? `${entraram.join(', ')} ganharam espaço e entraram no Top 5` : 'O Top 5 se manteve próximo do anterior'}${sairam.length ? `, enquanto ${sairam.join(', ')} passaram para outras faixas do ranking` : ''}. A leitura deve ser feita como mudança relativa de saliência, não como ganho ou perda de capacidade.`
        : 'Seu Top 5 permaneceu estável entre as duas aplicações, embora outras forças tenham mudado de posição. Isso sugere continuidade na assinatura com ajustes na base de suporte.',
    assinatura_agora: `O Top 5 atual é formado por ${assinaturaAtual.join(', ')}. Esse conjunto representa as forças que aparecem com maior naturalidade nesta medição e deve ser lido em combinação, não isoladamente.`,
    suporte_e_equilibrio: `Entre a 6ª e a 18ª posição aparecem ${suporte.slice(0, 6).join(', ')} e outras forças de suporte. Elas podem funcionar como repertório para equilibrar o Top 5 conforme a situação exigir.`,
    contrastes_e_pontos_cegos: `As forças entre a 19ª e a 24ª posição são ${menores.join(', ')}. Elas não são fraquezas. Vale observar quais demandas profissionais exigem uso prolongado dessas forças, porque podem pedir mais intenção ou energia neste momento.`,
    alavancagem_profissional: `Use as forças do Top 5 como ponto de partida para tarefas que exigem forças menos acessadas. Transformar demandas difíceis em situações que ativem ${assinaturaAtual.slice(0, 2).join(' e ')} pode reduzir esforço e aumentar consistência.`,
    movimentos_chave,
    acoes: [
      `Escolha uma situação real desta semana e registre como ${assinaturaAtual[0]} e ${assinaturaAtual[1]} aparecem na sua forma de decidir e agir.`,
      `Observe uma tarefa que exige ${menores[0]} ou ${menores[1]} e planeje como uma força do seu Top 5 pode ajudar a sustentá-la.`,
    ],
  };
}

function normalizarAnalise(
  valor: unknown,
  anterior: string[],
  atual: string[]
): ViaEvolucaoAnalise {
  const fallback = fallbackAnalise(anterior, atual);
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return fallback;

  const raw = valor as Record<string, unknown>;
  const conhecidos = new Set(atual);
  const calculados = calcularMovimentos(anterior, atual);
  const porForca = new Map(calculados.map((m) => [m.forca, m]));

  const movimentosIa: ViaEvolucaoMovimento[] = [];
  const rawMovimentos = Array.isArray(raw.movimentos_chave) ? raw.movimentos_chave : [];

  for (const item of rawMovimentos) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const m = item as Record<string, unknown>;
    const forca = texto(m.forca);
    if (!forca || !conhecidos.has(forca) || movimentosIa.some((x) => x.forca === forca)) continue;

    const calculado = porForca.get(forca);
    if (!calculado) continue;

    movimentosIa.push({
      forca,
      posicao_anterior: numero(m.posicao_anterior) ?? calculado.posicao_anterior,
      posicao_atual: numero(m.posicao_atual) ?? calculado.posicao_atual,
      leitura: texto(m.leitura) || leituraMovimento(calculado),
    });
  }

  for (const calculado of calculados) {
    if (movimentosIa.length >= 4) break;
    if (movimentosIa.some((m) => m.forca === calculado.forca)) continue;
    movimentosIa.push({
      forca: calculado.forca,
      posicao_anterior: calculado.posicao_anterior,
      posicao_atual: calculado.posicao_atual,
      leitura: leituraMovimento(calculado),
    });
  }

  const acoesRaw = Array.isArray(raw.acoes)
    ? raw.acoes.map(texto).filter(Boolean).slice(0, 2)
    : [];

  return {
    resumo: texto(raw.resumo) || fallback.resumo,
    assinatura_agora: texto(raw.assinatura_agora) || fallback.assinatura_agora,
    suporte_e_equilibrio: texto(raw.suporte_e_equilibrio) || fallback.suporte_e_equilibrio,
    contrastes_e_pontos_cegos:
      texto(raw.contrastes_e_pontos_cegos) || fallback.contrastes_e_pontos_cegos,
    alavancagem_profissional:
      texto(raw.alavancagem_profissional) || fallback.alavancagem_profissional,
    movimentos_chave: movimentosIa.slice(0, 5),
    acoes: [...acoesRaw, ...fallback.acoes].slice(0, 2),
  };
}

async function gerarAnalise(
  anterior: string[],
  atual: string[]
): Promise<{ analise: ViaEvolucaoAnalise; fonte: 'ia_json' | 'ia_texto' | 'regra' }> {
  const prompt = montarPromptEvolucaoVia(anterior, atual);

  try {
    const bruto = await chamarClaudeJson<Record<string, unknown>>(prompt, {
      maxTokens: 2200,
      descricao: 'evolução comparativa VIA',
    });

    return {
      analise: normalizarAnalise(bruto, anterior, atual),
      fonte: 'ia_json',
    };
  } catch (errorJson) {
    console.warn(
      '[EVOLUCAO-VIA] JSON da IA inválido, tentando fallback textual:',
      errorJson instanceof Error ? errorJson.message : 'erro desconhecido'
    );

    try {
      const leitura = await chamarClaude(
        `${prompt}

A resposta estruturada anterior falhou. Agora responda em texto corrido, curto e objetivo, com no máximo 6 parágrafos. Não use JSON. Faça a leitura integrada das mudanças sem inventar fatos.`,
        1400
      );

      const base = fallbackAnalise(anterior, atual);
      return {
        analise: {
          ...base,
          resumo: leitura.trim() || base.resumo,
        },
        fonte: 'ia_texto',
      };
    } catch (errorTexto) {
      console.error(
        '[EVOLUCAO-VIA] Fallback textual também falhou:',
        errorTexto instanceof Error ? errorTexto.message : 'erro desconhecido'
      );

      return {
        analise: fallbackAnalise(anterior, atual),
        fonte: 'regra',
      };
    }
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

    const aiAllowed = await consumeIdentifierRateLimit({
      scope: 'ai_via_evolucao',
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

  const { data: resultados, error: resultadosError } = await supabase
    .from('via_resultados')
    .select('id, forcas')
    .eq('user_id', user.id)
    .in('id', [resultadoAtualId, resultadoAnteriorId])
    .returns<RankingRow[]>();

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

  const { data: cache, error: cacheReadError } = await supabase
    .from('via_evolucao_analises')
    .select('analise_json, geracao_fonte')
    .eq('user_id', user.id)
    .eq('resultado_atual_id', resultadoAtualId)
    .eq('resultado_anterior_id', resultadoAnteriorId)
    .maybeSingle();

  if (cacheReadError) {
    console.warn('[EVOLUCAO-VIA] Cache não pôde ser lido:', cacheReadError.message);
  }

  const admin = createAdminClient();

  if (cache?.analise_json) {
    const normalizada = normalizarAnalise(
      cache.analise_json,
      anterior.forcas,
      atual.forcas
    );

    const { error: repairError } = await admin
      .from('via_evolucao_analises')
      .upsert(
        {
          user_id: user.id,
          resultado_anterior_id: resultadoAnteriorId,
          resultado_atual_id: resultadoAtualId,
          analise_json: normalizada,
          geracao_fonte: cache.geracao_fonte || 'cache',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,resultado_anterior_id,resultado_atual_id' }
      );

    if (repairError) {
      console.warn('[EVOLUCAO-VIA] Cache lido, mas não pôde ser normalizado:', repairError.message);
    }

    return NextResponse.json(
      { analise: normalizada, cached: true },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  const { analise, fonte } = await gerarAnalise(anterior.forcas, atual.forcas);

  const { error: saveError } = await admin
    .from('via_evolucao_analises')
    .upsert(
      {
        user_id: user.id,
        resultado_anterior_id: resultadoAnteriorId,
        resultado_atual_id: resultadoAtualId,
        analise_json: analise,
        geracao_fonte: fonte,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,resultado_anterior_id,resultado_atual_id' }
    );

  if (saveError) {
    console.error('[EVOLUCAO-VIA] A leitura foi gerada, mas não foi salva:', saveError.message);
    return NextResponse.json(
      {
        error:
          'A leitura foi gerada, mas não consegui salvá-la com segurança. Tente novamente para evitar perder a análise.',
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { analise, cached: false },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
