import { chamarClaude } from './anthropic';

type JsonOptions<T> = {
  maxTokens?: number;
  validar?: (valor: unknown) => valor is T;
  descricao?: string;
};

function extrairTrechoBalanceado(texto: string): string {
  const limpo = texto
    .replace(/^\s*\`\`\`(?:json)?\s*/i, '')
    .replace(/\s*\`\`\`\s*$/i, '')
    .trim();

  const inicioObjeto = limpo.indexOf('{');
  const inicioArray = limpo.indexOf('[');
  const inicios = [inicioObjeto, inicioArray].filter((i) => i >= 0);
  if (inicios.length === 0) return limpo;

  const inicio = Math.min(...inicios);
  const abre = limpo[inicio];
  const fecha = abre === '{' ? '}' : ']';
  let profundidade = 0;
  let emString = false;
  let escapado = false;

  for (let i = inicio; i < limpo.length; i += 1) {
    const char = limpo[i];

    if (emString) {
      if (escapado) {
        escapado = false;
      } else if (char === '\\') {
        escapado = true;
      } else if (char === '"') {
        emString = false;
      }
      continue;
    }

    if (char === '"') {
      emString = true;
      continue;
    }

    if (char === abre) profundidade += 1;
    if (char === fecha) profundidade -= 1;

    if (profundidade === 0) {
      return limpo.slice(inicio, i + 1);
    }
  }

  return limpo.slice(inicio);
}

export function parseJsonDaIA<T>(texto: string, validar?: (valor: unknown) => valor is T): T {
  const trecho = extrairTrechoBalanceado(texto);
  const valor: unknown = JSON.parse(trecho);

  if (validar && !validar(valor)) {
    throw new Error('JSON da IA não corresponde ao formato esperado.');
  }

  return valor as T;
}

export async function chamarClaudeJson<T>(
  prompt: string,
  options: JsonOptions<T> = {}
): Promise<T> {
  const maxTokens = options.maxTokens ?? 4000;
  const descricao = options.descricao ?? 'resposta estruturada';

  const primeiraResposta = await chamarClaude(prompt, maxTokens);

  try {
    return parseJsonDaIA<T>(primeiraResposta, options.validar);
  } catch (primeiroErro) {
    console.warn(
      '[AI JSON] primeira resposta inválida',
      descricao,
      primeiroErro instanceof Error ? primeiroErro.message : 'erro desconhecido',
      'chars:',
      primeiraResposta.length
    );
  }

  const promptRetry = `${prompt}

ATENÇÃO À FORMATAÇÃO DA RESPOSTA:
A tentativa anterior não pôde ser interpretada pelo sistema.
Responda novamente SOMENTE com o JSON solicitado.
Não use markdown, crases, comentários ou texto antes/depois do JSON.
Mantenha o conteúdo objetivo e compacto para garantir que o JSON seja fechado por completo.`;

  const retryMaxTokens = Math.min(Math.max(maxTokens + 1200, Math.ceil(maxTokens * 1.6)), 7000);
  const segundaResposta = await chamarClaude(promptRetry, retryMaxTokens);

  try {
    return parseJsonDaIA<T>(segundaResposta, options.validar);
  } catch (segundoErro) {
    console.error(
      '[AI JSON] segunda resposta inválida',
      descricao,
      segundoErro instanceof Error ? segundoErro.message : 'erro desconhecido',
      'chars:',
      segundaResposta.length,
      'maxTokensRetry:',
      retryMaxTokens
    );
    throw new Error(
      'Não consegui montar o resultado estruturado agora. Tente novamente em alguns instantes.'
    );
  }
}
