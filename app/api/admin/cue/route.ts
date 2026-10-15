import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listManusAgents, ManusConnectionError } from '@/lib/manus';

export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401, headers });
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403, headers });
  const apiKey = process.env.MANUS_API_KEY;
  const agentId = process.env.MANUS_AGENT_ID;
  if (!apiKey) return NextResponse.json({ status: 'missing_key', message: 'A conexão aguarda a credencial do Manus.', automaticSending: false }, { headers });
  try {
    const agents = await listManusAgents(apiKey);
    const selected = agentId ? agents.find(agent => agent.id === agentId) : undefined;
    return NextResponse.json({
      status: selected ? 'connected' : agentId ? 'agent_not_found' : 'select_agent',
      message: selected
        ? `Conexão verificada com ${selected.nickname}. Envios automáticos desativados.`
        : agentId
          ? 'Credencial validada, mas o ID configurado em MANUS_AGENT_ID não aparece nesta conta Manus.'
          : 'Credencial Manus validada. Configure MANUS_AGENT_ID com o ID exato da Íris para concluir a conexão.',
      agents: agents.map(agent => ({ id: agent.id, name: agent.nickname })),
      selectedAgent: selected ? { id: selected.id, name: selected.nickname } : null,
      automaticSending: false,
    }, { headers });
  } catch (error) {
    if (error instanceof ManusConnectionError) {
      return NextResponse.json({
        status: error.issue,
        error: error.message,
        automaticSending: false,
      }, { status: 502, headers });
    }
    return NextResponse.json({
      status: 'unknown_failure',
      error: 'Não foi possível verificar a conexão com a API Manus no momento.',
      automaticSending: false,
    }, { status: 502, headers });
  }
}
