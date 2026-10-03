type FragmentoContexto = {
  codigo: string;
  titulo: string;
  texto: string;
  prioridade?: 'alta' | 'normal';
};

type ChoiceAnswer = {
  choice?: string;
  confidence?: number;
};

type JevResponse = {
  model?: string;
  answers?: Record<string, ChoiceAnswer>;
  usage?: { input_tokens?: number; output_tokens?: number };
};

export type ContextoLinkedInClassificado = {
  fragmentos: FragmentoContexto[];
  metodo: 'jev' | 'completo';
  charsAntes: number;
  charsDepois: number;
  selecionados: string[];
  jevInputTokens?: number;
};

function limpar(texto: string) {
  return (texto || '')
    .replace(/\s+/g, ' ')
    .replace(/\u0000/g, '')
    .trim();
}

function limitar(texto: string, max = 4500) {
  const limpo = limpar(texto);
  return limpo.length > max ? limpo.slice(0, max) + '…' : limpo;
}

function totalChars(fragmentos: FragmentoContexto[]) {
  return fragmentos.reduce((s, f) => s + f.texto.length, 0);
}

export async function classificarContextoLinkedIn(
  originais: FragmentoContexto[]
): Promise<ContextoLinkedInClassificado> {
  const fragmentos = originais
    .map((f) => ({ ...f, texto: limitar(f.texto) }))
    .filter((f) => f.texto.length > 0);

  const charsAntes = totalChars(fragmentos);

  if (fragmentos.length <= 7) {
    return {
      fragmentos,
      metodo: 'completo',
      charsAntes,
      charsDepois: charsAntes,
      selecionados: fragmentos.map((f) => f.codigo),
    };
  }

  const apiKey = process.env.TYPESAFE_API_KEY?.trim();
  if (!apiKey) {
    return {
      fragmentos,
      metodo: 'completo',
      charsAntes,
      charsDepois: charsAntes,
      selecionados: fragmentos.map((f) => f.codigo),
    };
  }

  const baseUrl = (process.env.TYPESAFE_BASE_URL || 'https://api.typesafe.ai').replace(/\/$/, '');
  const model = process.env.TYPESAFE_MODEL || 'jev-latest';
  const codigos = new Set(fragmentos.map((f) => f.codigo));
  const obrigatorios = new Set(
    fragmentos.filter((f) => f.prioridade === 'alta').map((f) => f.codigo)
  );

  const criteria = Object.fromEntries(
    fragmentos.map((f) => [
      f.codigo,
      `${f.titulo}. Escolha somente se esse bloco trouxer evidência concreta útil para escrever o conteúdo sem inventar.`,
    ])
  );

  const state = {
    objetivo:
      'Selecionar os menores blocos de contexto suficientes para personalizar um conteúdo de LinkedIn mantendo autenticidade, posicionamento e evidências reais.',
    fragmentos: fragmentos.map((f) => ({
      codigo: f.codigo,
      titulo: f.titulo,
      texto: f.texto,
    })),
  };

  const questions = {
    identidade_e_voz: {
      type: 'choice',
      instructions: 'Qual bloco melhor representa identidade, linguagem ou forma de se comunicar?',
      criteria,
    },
    autoridade_real: {
      type: 'choice',
      instructions: 'Qual bloco traz a melhor evidência de experiência, competência ou prova real?',
      criteria,
    },
    posicionamento: {
      type: 'choice',
      instructions: 'Qual bloco esclarece melhor direção profissional, diferenciais ou posicionamento?',
      criteria,
    },
    historia_concreta: {
      type: 'choice',
      instructions: 'Qual bloco contém a história, situação ou aprendizado mais concreto que pode dar naturalidade ao post?',
      criteria,
    },
    audiencia: {
      type: 'choice',
      instructions: 'Qual bloco ajuda mais a entender para quem essa pessoa quer falar e que valor ela entrega?',
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
      body: JSON.stringify({ model, state, questions }),
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`Jev indisponível: ${response.status}`);

    const data = (await response.json()) as JevResponse;
    const selecionados = new Set<string>(obrigatorios);

    for (const answer of Object.values(data.answers ?? {})) {
      if (
        answer?.choice &&
        codigos.has(answer.choice) &&
        (answer.confidence ?? 0) >= 0.32
      ) {
        selecionados.add(answer.choice);
      }
    }

    if (selecionados.size < 4) {
      return {
        fragmentos,
        metodo: 'completo',
        charsAntes,
        charsDepois: charsAntes,
        selecionados: fragmentos.map((f) => f.codigo),
        jevInputTokens: data.usage?.input_tokens,
      };
    }

    const escolhidos = fragmentos.filter((f) => selecionados.has(f.codigo));
    const charsDepois = totalChars(escolhidos);

    console.info('[Jev LinkedIn] contexto reduzido', {
      antes: fragmentos.length,
      depois: escolhidos.length,
      charsAntes,
      charsDepois,
      reducaoPercentual:
        charsAntes > 0 ? Math.round((1 - charsDepois / charsAntes) * 100) : 0,
      jevInputTokens: data.usage?.input_tokens,
    });

    return {
      fragmentos: escolhidos,
      metodo: 'jev',
      charsAntes,
      charsDepois,
      selecionados: escolhidos.map((f) => f.codigo),
      jevInputTokens: data.usage?.input_tokens,
    };
  } catch (error) {
    console.warn(
      '[Jev LinkedIn] fallback para contexto completo',
      error instanceof Error ? error.message : 'erro desconhecido'
    );
    return {
      fragmentos,
      metodo: 'completo',
      charsAntes,
      charsDepois: charsAntes,
      selecionados: fragmentos.map((f) => f.codigo),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function serializarContextoLinkedIn(fragmentos: FragmentoContexto[]) {
  return fragmentos
    .map((f) => `## ${f.titulo}\n${f.texto}`)
    .join('\n\n');
}

export type { FragmentoContexto };
