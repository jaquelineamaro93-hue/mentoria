/** Consulta somente leitura de agentes Manus/Cue. Nunca importar no cliente. */
export type ManusAgent = { id: string; task_id: string; nickname: string };
export type ManusConnectionIssue =
  | 'invalid_credential' | 'permission_denied' | 'rate_limited'
  | 'service_unavailable' | 'network_error' | 'timeout' | 'invalid_response';

export class ManusConnectionError extends Error {
  constructor(public readonly issue: ManusConnectionIssue, message: string) {
    super(message);
    this.name = 'ManusConnectionError';
  }
}

export async function listManusAgents(apiKey: string): Promise<ManusAgent[]> {
  let response: Response;
  try {
    response = await fetch('https://api.manus.ai/v2/agent.list', {
      method: 'GET',
      headers: { 'x-manus-api-key': apiKey },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new ManusConnectionError('timeout', 'A API Manus demorou para responder. Tente novamente em instantes.');
    }
    throw new ManusConnectionError('network_error', 'Não foi possível acessar a API Manus. Confira a disponibilidade da conexão.');
  }

  // Retornar códigos seguros ao administrador, sem expor token nem resposta bruta.
  if (!response.ok) {
    if (response.status === 401) {
      throw new ManusConnectionError('invalid_credential', 'A API Manus recusou a chave (401). Confira a MANUS_API_KEY de produção na Vercel.');
    }
    if (response.status === 403) {
      throw new ManusConnectionError('permission_denied', 'A API Manus negou acesso à listagem de agentes (403). Verifique as permissões da conta e da chave.');
    }
    if (response.status === 429) {
      throw new ManusConnectionError('rate_limited', 'O limite temporário de consultas da API Manus foi atingido (429). Tente novamente mais tarde.');
    }
    if (response.status >= 500) {
      throw new ManusConnectionError('service_unavailable', 'A API Manus está indisponível no momento. Tente novamente.');
    }
    throw new ManusConnectionError('invalid_response', 'A API Manus não aceitou a consulta de agentes. Verifique as configurações da conta.');
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ManusConnectionError('invalid_response', 'A API Manus respondeu com dados inválidos. Tente novamente.');
  }
  if (!body || typeof body !== 'object' || !('ok' in body) || body.ok !== true ||
      !('data' in body) || !Array.isArray(body.data)) {
    throw new ManusConnectionError('invalid_response', 'Resposta inesperada do Manus. A consulta não retornou a lista de agentes.');
  }

  return body.data.map((agent: unknown) => {
    if (!agent || typeof agent !== 'object' || !('id' in agent) || typeof agent.id !== 'string' ||
        !('task_id' in agent) || typeof agent.task_id !== 'string' ||
        !('nickname' in agent) || typeof agent.nickname !== 'string') {
      throw new ManusConnectionError('invalid_response', 'Dados de agente inválidos na resposta da API Manus.');
    }
    return { id: agent.id, task_id: agent.task_id, nickname: agent.nickname };
  });
}
