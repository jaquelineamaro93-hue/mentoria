/** Consulta somente leitura de agentes Manus/Cue. Nunca importar no cliente. */
export type ManusAgent = { id: string; task_id: string | null; nickname: string };
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

  // A listagem é SOMENTE para verificar identidade dos agentes. Para ela,
  // o ID não pode faltar; task_id e nickname são metadados opcionais.
  // Alguns agentes padrão/legados podem omitir esses campos mesmo com HTTP 200.
  const agentes: ManusAgent[] = [];
  let registrosSemId = 0;

  for (const registro of body.data as unknown[]) {
    if (!registro || typeof registro !== 'object') {
      registrosSemId += 1;
      continue;
    }
    const agente = registro as Record<string, unknown>;
    const id = typeof agente.id === 'string' ? agente.id.trim() : '';
    if (!id) {
      registrosSemId += 1;
      continue;
    }
    const nickname = typeof agente.nickname === 'string' && agente.nickname.trim()
      ? agente.nickname.trim()
      : typeof agente.name === 'string' && agente.name.trim()
        ? agente.name.trim()
        : 'Agente sem nome';
    const task_id = typeof agente.task_id === 'string' && agente.task_id.trim()
      ? agente.task_id.trim()
      : null;
    agentes.push({ id, task_id, nickname });
  }

  // Não confirmar um vínculo com um agente quando o payload não possui IDs.
  // O erro não inclui a resposta ou qualquer dado sensível.
  if (body.data.length > 0 && agentes.length === 0) {
    throw new ManusConnectionError(
      'invalid_response',
      'A API Manus respondeu, mas nenhum agente veio com ID válido. Confira o formato retornado pelo endpoint agent.list.'
    );
  }
  if (registrosSemId > 0) {
    console.warn('[Manus] agent.list ignorou registros sem ID:', registrosSemId);
  }

  return agentes;
}
