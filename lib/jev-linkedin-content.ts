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
  metodo: 'jev' | 'compacto' | 'completo';
  charsAntes: number;
  charsDepois: number;
  selecionados: string[];
  jevInputTokens?: number;
};

const ORDEM_CONTEXTO = [
  'voz',
  'resumo_perfil',
  'linkedin_audit',
  'mapa_essencia',
  'bussola',
  'via',
  'pdi',
  'diario',
  'diagnostico',
  'quem_sou_eu',
  'perfil',
];

const LIMITE_TOTAL_CHARS = 15000;
const LIMITE_ALTA = 3400;
const LIMITE_NORMAL = 2600;

function limpar(texto: string) {
  return (texto || '')
    .replace(/\u0000/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function limitar(texto: string, max: number) {
  const limpo = limpar(texto);
  if (limpo.length <= max) return limpo;

  const recorte = limpo.slice(0, max);
  const ultimoParagrafo = Math.max(recorte.lastIndexOf('\n\n'), recorte.lastIndexOf('. '));
  const seguro = ultimoParagrafo > max * 0.68 ? recorte.slice(0, ultimoParagrafo + 1) : recorte;

  return seguro.trim() + '…';
}

function preparar(originais: FragmentoContexto[]) {
  return originais
    .map((f) => ({
      ...f,
      texto: limitar(f.texto, f.prioridade === 'alta' ? LIMITE_ALTA : LIMITE_NORMAL),
    }))
    .filter((f) => f.texto.length > 0);
}

function totalChars(fragmentos: FragmentoContexto[]) {
  return fragmentos.reduce((s, f) => s + f.texto.length, 0);
}

function ordenar(fragmentos: FragmentoContexto[]) {
  return [...fragmentos].sort((a, b) => {
    if (a.prioridade === 'alta' && b.prioridade !== 'alta') return -1;
    if (b.prioridade === 'alta' && a.prioridade !== 'alta') return 1;

    const ia = ORDEM_CONTEXTO.indexOf(a.codigo);
    const ib = ORDEM_CONTEXTO.indexOf(b.codigo);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
}

function compactar(
  fragmentos: FragmentoContexto[],
  obrigatoriosAdicionais: Set<string> = new Set()
) {
  const ordenados = ordenar(fragmentos);
  const escolhidos: FragmentoContexto[] = [];
  let total = 0;

  const obrigatorios = ordenados.filter(
    (f) => f.prioridade === 'alta' || obrigatoriosAdicionais.has(f.codigo)
  );

  for (const f of obrigatorios) {
    if (escolhidos.some((x) => x.codigo === f.codigo)) continue;

    const restante = Math.max(900, LIMITE_TOTAL_CHARS - total);
    const ajustado = { ...f, texto: limitar(f.texto, restante) };
    escolhidos.push(ajustado);
    total += ajustado.texto.length;

    if (total >= LIMITE_TOTAL_CHARS) break;
  }

  if (total < LIMITE_TOTAL_CHARS) {
    for (const f of ordenados) {
      if (escolhidos.some((x) => x.codigo === f.codigo)) continue;
      const restante = LIMITE_TOTAL_CHARS - total;
      if (restante < 700) break;

      const ajustado = { ...f, texto: limitar(f.texto, Math.min(f.texto.length, restante)) };
      escolhidos.push(ajustado);
      total += ajustado.texto.length;
    }
  }

  return escolhidos;
}

function resposta(
  fragmentos: FragmentoContexto[],
  metodo: ContextoLinkedInClassificado['metodo'],
  charsAntes: number,
  jevInputTokens?: number
): ContextoLinkedInClassificado {
  return {
    fragmentos,
    metodo,
    charsAntes,
    charsDepois: totalChars(fragmentos),
    selecionados: fragmentos.map((f) => f.codigo),
    jevInputTokens,
  };
}

export async function classificarContextoLinkedIn(
  originais: FragmentoContexto[]
): Promise<ContextoLinkedInClassificado> {
  const fragmentos = preparar(originais);
  const charsAntes = totalChars(fragmentos);

  if (charsAntes <= LIMITE_TOTAL_CHARS && fragmentos.length <= 7) {
    return resposta(fragmentos, 'completo', charsAntes);
  }

  const apiKey = process.env.TYPESAFE_API_KEY?.trim();
  if (!apiKey) {
    return resposta(compactar(fragmentos), 'compacto', charsAntes);
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
  const timeout = setTimeout(() => controller.abort(), 2800);

  try {
    const responseJev = await fetch(`${baseUrl}/v1/systemone`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, state, questions }),
      signal: controller.signal,
    });

    if (!responseJev.ok) throw new Error(`Jev indisponível: ${responseJev.status}`);

    const data = (await responseJev.json()) as JevResponse;
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

    const escolhidos = compactar(fragmentos, selecionados);

    if (escolhidos.length < 3) {
      return resposta(compactar(fragmentos), 'compacto', charsAntes, data.usage?.input_tokens);
    }

    console.info('[Jev LinkedIn] contexto selecionado', {
      antes: fragmentos.length,
      depois: escolhidos.length,
      charsAntes,
      charsDepois: totalChars(escolhidos),
      reducaoPercentual:
        charsAntes > 0 ? Math.round((1 - totalChars(escolhidos) / charsAntes) * 100) : 0,
      jevInputTokens: data.usage?.input_tokens,
    });

    return resposta(escolhidos, 'jev', charsAntes, data.usage?.input_tokens);
  } catch (error) {
    console.warn(
      '[Jev LinkedIn] fallback compacto',
      error instanceof Error ? error.message : 'erro desconhecido'
    );
    return resposta(compactar(fragmentos), 'compacto', charsAntes);
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
