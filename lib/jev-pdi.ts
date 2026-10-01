import type { RespostaSecaoPDI } from './prompts-pdi';

type ChoiceAnswer = {
  type?: string;
  choice?: string;
  confidence?: number;
  probabilities?: Record<string, number>;
};

type JevResponse = {
  model?: string;
  answers?: Record<string, ChoiceAnswer>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
};

export type ContextoPdiClassificado = {
  respostas: RespostaSecaoPDI[];
  metodo: 'jev' | 'completo';
  secoesSelecionadas: string[];
  charsAntes: number;
  charsDepois: number;
  jevInputTokens?: number;
};

const SECOES_BASE = new Set([
  'swot',
  'metas_smart',
  'habilidades_tecnicas',
  'competencias_comportamentais',
  'planejamento_futuro',
]);

function limparTexto(texto: string): string {
  return texto
    .replace(/^\s*\|?[\s:|-]{4,}\|?\s*$/gm, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizar(respostas: RespostaSecaoPDI[]): RespostaSecaoPDI[] {
  return respostas
    .map((resposta) => ({
      ...resposta,
      resposta: limparTexto(resposta.resposta ?? ''),
    }))
    .filter((resposta) => resposta.resposta.length > 0);
}

function somaChars(respostas: RespostaSecaoPDI[]): number {
  return respostas.reduce((total, resposta) => total + resposta.resposta.length, 0);
}

function criteriosDasSecoes(respostas: RespostaSecaoPDI[]): Record<string, string> {
  return Object.fromEntries(
    respostas.map((resposta) => [
      resposta.codigo,
      `${resposta.titulo}. Escolha esta opção somente quando o conteúdo desta seção trouxer a evidência mais útil para a decisão.`,
    ])
  );
}

function respostasDoJev(
  respostas: RespostaSecaoPDI[],
  selecionadas: Set<string>
): RespostaSecaoPDI[] {
  const porCodigo = new Map(respostas.map((resposta) => [resposta.codigo, resposta]));
  return [...selecionadas]
    .map((codigo) => porCodigo.get(codigo))
    .filter((resposta): resposta is RespostaSecaoPDI => Boolean(resposta));
}

export async function classificarContextoPdi(
  respostasOriginais: RespostaSecaoPDI[]
): Promise<ContextoPdiClassificado> {
  const respostas = normalizar(respostasOriginais);
  const charsAntes = somaChars(respostas);

  if (respostas.length <= 9) {
    return {
      respostas,
      metodo: 'completo',
      secoesSelecionadas: respostas.map((resposta) => resposta.codigo),
      charsAntes,
      charsDepois: charsAntes,
    };
  }

  const apiKey = process.env.TYPESAFE_API_KEY?.trim();
  if (!apiKey) {
    return {
      respostas,
      metodo: 'completo',
      secoesSelecionadas: respostas.map((resposta) => resposta.codigo),
      charsAntes,
      charsDepois: charsAntes,
    };
  }

  const baseUrl = (process.env.TYPESAFE_BASE_URL || 'https://api.typesafe.ai').replace(/\/$/, '');
  const model = process.env.TYPESAFE_MODEL || 'jev-latest';
  const criteria = criteriosDasSecoes(respostas);

  const state = {
    objetivo:
      'Selecionar somente as seções do PDI que carregam a evidência mais útil para uma geração posterior por LLM. Não escrever o plano.',
    secoes: respostas.map((resposta) => ({
      codigo: resposta.codigo,
      titulo: resposta.titulo,
      texto: resposta.resposta,
    })),
  };

  const questions = {
    objetivo_central: {
      type: 'choice',
      instructions:
        'Qual seção expressa com mais clareza o objetivo profissional central deste ciclo?',
      criteria,
    },
    gargalo_principal: {
      type: 'choice',
      instructions:
        'Qual seção contém a evidência mais clara do principal gargalo ou capacidade a desenvolver?',
      criteria,
    },
    acao_90_dias: {
      type: 'choice',
      instructions:
        'Qual seção é mais útil para decidir ações concretas e verificáveis para os próximos 90 dias?',
      criteria,
    },
    risco_sustentabilidade: {
      type: 'choice',
      instructions:
        'Qual seção traz a evidência mais importante sobre risco de sobrecarga, comportamento ou sustentabilidade do plano?',
      criteria,
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch(`${baseUrl}/v1/systemone`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        state,
        questions,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn('[Jev PDI] classificação indisponível', response.status);
      return {
        respostas,
        metodo: 'completo',
        secoesSelecionadas: respostas.map((resposta) => resposta.codigo),
        charsAntes,
        charsDepois: charsAntes,
      };
    }

    const data = (await response.json()) as JevResponse;
    const codigosValidos = new Set(respostas.map((resposta) => resposta.codigo));
    const selecionadas = new Set<string>();

    for (const codigo of SECOES_BASE) {
      if (codigosValidos.has(codigo)) selecionadas.add(codigo);
    }

    let escolhasConfiaveis = 0;
    for (const answer of Object.values(data.answers ?? {})) {
      const choice = answer?.choice;
      const confidence = typeof answer?.confidence === 'number' ? answer.confidence : 0;

      if (choice && codigosValidos.has(choice) && confidence >= 0.35) {
        selecionadas.add(choice);
        escolhasConfiaveis += 1;
      }
    }

    // Se o classificador estiver incerto, priorizamos qualidade e mandamos o
    // contexto completo ao Claude em vez de "economizar" tokens às cegas.
    if (escolhasConfiaveis < 2 || selecionadas.size < 6) {
      return {
        respostas,
        metodo: 'completo',
        secoesSelecionadas: respostas.map((resposta) => resposta.codigo),
        charsAntes,
        charsDepois: charsAntes,
        jevInputTokens: data.usage?.input_tokens,
      };
    }

    const selecionadasOrdenadas = respostasDoJev(respostas, selecionadas);
    const charsDepois = somaChars(selecionadasOrdenadas);

    console.info('[Jev PDI] contexto classificado', {
      secoesAntes: respostas.length,
      secoesDepois: selecionadasOrdenadas.length,
      charsAntes,
      charsDepois,
      reducaoPercentual:
        charsAntes > 0 ? Math.round((1 - charsDepois / charsAntes) * 100) : 0,
      jevInputTokens: data.usage?.input_tokens,
      model: data.model ?? model,
    });

    return {
      respostas: selecionadasOrdenadas,
      metodo: 'jev',
      secoesSelecionadas: selecionadasOrdenadas.map((resposta) => resposta.codigo),
      charsAntes,
      charsDepois,
      jevInputTokens: data.usage?.input_tokens,
    };
  } catch (error) {
    console.warn(
      '[Jev PDI] fallback para contexto completo',
      error instanceof Error ? error.message : 'erro desconhecido'
    );

    return {
      respostas,
      metodo: 'completo',
      secoesSelecionadas: respostas.map((resposta) => resposta.codigo),
      charsAntes,
      charsDepois: charsAntes,
    };
  } finally {
    clearTimeout(timeout);
  }
}
