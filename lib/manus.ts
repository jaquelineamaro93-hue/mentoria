/** Server-side, read-only Manus connection. Never import into a client component. */
export type ManusAgent = { id: string; task_id: string; nickname: string };
export async function listManusAgents(apiKey: string): Promise<ManusAgent[]> {
  const response = await fetch('https://api.manus.ai/v2/agent.list', {
    headers: { 'x-manus-api-key': apiKey }, cache: 'no-store',
    redirect: 'error', signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('Não foi possível autenticar ou consultar o Manus.');
  const body: unknown = await response.json();
  if (!body || typeof body !== 'object' || !('ok' in body) || body.ok !== true ||
      !('data' in body) || !Array.isArray(body.data)) {
    throw new Error('Resposta inesperada do Manus.');
  }
  return body.data.map((agent: unknown) => {
    if (!agent || typeof agent !== 'object' || !('id' in agent) || typeof agent.id !== 'string' ||
        !('task_id' in agent) || typeof agent.task_id !== 'string' ||
        !('nickname' in agent) || typeof agent.nickname !== 'string') {
      throw new Error('Dados de agente inválidos.');
    }
    return { id: agent.id, task_id: agent.task_id, nickname: agent.nickname };
  });
}
