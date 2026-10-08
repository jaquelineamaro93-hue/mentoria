import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { consumeSecurityRateLimit } from '@/lib/security/rate-limit';

const RELACOES = new Set([
  'gestor_direto',
  'lideranca_indireta',
  'responde_a_mim',
  'par',
  'stakeholder',
  'cliente',
  'fornecedor',
  'colega_faculdade',
  'professor',
  'amigo_pessoal',
  'outro',
]);

const CONVIVENCIAS = new Set(['alta', 'media', 'baixa']);

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

  if (!isUuid(token)) {
    return NextResponse.json({ error: 'Link inválido.' }, { status: 404 });
  }

  const [ipAllowed, tokenAllowed] = await Promise.all([
    consumeSecurityRateLimit({
      request,
      scope: 'feedback360_submit_ip',
      limit: 30,
      windowSeconds: 60 * 60,
    }),
    consumeSecurityRateLimit({
      request,
      scope: 'feedback360_submit_token',
      identifier: token,
      limit: 20,
      windowSeconds: 60 * 60,
    }),
  ]);

  if (!ipAllowed || !tokenAllowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde alguns minutos.' },
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | {
        nome?: string;
        cargo_funcao?: string;
        empresa_contexto?: string;
        relacao?: string;
        relacao_outro?: string;
        convivencia?: string;
        respostas?: Array<{ question_id?: string; resposta?: string }>;
      }
    | null;

  const relacao = body?.relacao?.trim() || '';
  const convivencia = body?.convivencia?.trim() || '';
  const respostas = Array.isArray(body?.respostas) ? body!.respostas : [];

  if (
    !RELACOES.has(relacao) ||
    !CONVIVENCIAS.has(convivencia) ||
    respostas.length < 1 ||
    respostas.length > 30
  ) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  if (
    respostas.some(
      (item) =>
        !item?.question_id ||
        !isUuid(item.question_id) ||
        typeof item.resposta !== 'string' ||
        item.resposta.trim().length < 1 ||
        item.resposta.length > 5000
    )
  ) {
    return NextResponse.json({ error: 'Respostas inválidas.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc('submit_feedback_360_public', {
    p_token: token,
    p_nome: String(body?.nome || '').trim().slice(0, 160),
    p_cargo_funcao: String(body?.cargo_funcao || '').trim().slice(0, 200),
    p_empresa_contexto: String(body?.empresa_contexto || '').trim().slice(0, 250),
    p_relacao: relacao,
    p_relacao_outro: String(body?.relacao_outro || '').trim().slice(0, 160),
    p_convivencia: convivencia,
    p_respostas: respostas.map((item) => ({
      question_id: item.question_id,
      resposta: item.resposta!.trim(),
    })),
  });

  if (error) {
    console.error('[PUBLIC-FEEDBACK-360] Falha ao registrar resposta:', error.message);
    return NextResponse.json({ error: 'Não foi possível registrar o feedback.' }, { status: 400 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  });
}
