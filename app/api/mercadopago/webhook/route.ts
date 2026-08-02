import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buscarPreapprovalMercadoPago } from '@/lib/mercadopago';

export async function POST(request: Request) {
  const body = await request.json();

  // O Mercado Pago manda notificações de vários tipos, só nos interessa preapproval
  const tipo = body.type ?? body.topic;
  const preapprovalId = body.data?.id ?? body.id;

  if (tipo !== 'preapproval' || !preapprovalId) {
    return NextResponse.json({ ignorado: true });
  }

  try {
    const supabase = createAdminClient();
    const preapproval = await buscarPreapprovalMercadoPago(preapprovalId);
    const userId = preapproval.external_reference;

    if (!userId) {
      return NextResponse.json({ erro: 'Sem external_reference' }, { status: 400 });
    }

    const novoStatus =
      preapproval.status === 'authorized'
        ? 'ativo'
        : preapproval.status === 'cancelled' || preapproval.status === 'paused'
          ? 'encerrado'
          : 'inadimplente';

    await supabase
      .from('profiles')
      .update({
        status_assinatura: novoStatus,
        origem_assinatura: 'mercadopago',
        mp_subscription_id: preapproval.id,
      })
      .eq('id', userId);

    await supabase.from('pagamentos_historico').insert({
      user_id: userId,
      valor: preapproval.auto_recurring?.transaction_amount ?? null,
      status: preapproval.status,
      mp_payment_id: preapproval.id,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
