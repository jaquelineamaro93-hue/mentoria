import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buscarPreapprovalMercadoPago, buscarPagamentoMercadoPago, buscarPagamentoAssinaturaMercadoPago } from '@/lib/mercadopago';
import { verificarAssinaturaWebhook } from '@/lib/mercadopago-webhook-security';

export async function POST(request: Request) {
  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }
  const id = new URL(request.url).searchParams.get('data.id');
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  const tipo = body.type ?? body.topic;
  if (!id || (body.data?.id != null && String(body.data.id) !== id)) {
    return NextResponse.json({ error: 'Identificador ausente ou divergente.' }, { status: 400 });
  }
  const assinatura = verificarAssinaturaWebhook(request.headers.get('x-signature'), request.headers.get('x-request-id'), id);
  if (!assinatura.valido) return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 });
  try {
    const admin = createAdminClient();
    if (tipo === 'subscription_preapproval' || tipo === 'preapproval') {
      const subscription = await buscarPreapprovalMercadoPago(id);
      const { data: pedido, error } = await admin.from('mp_pedidos').select('id, mp_resource_id')
        .eq('id', subscription.external_reference).eq('forma_pagamento', 'recorrente').maybeSingle();
      if (error) throw error;
      if (!pedido) return NextResponse.json({ ignorado: true });
      if (pedido.mp_resource_id !== String(subscription.id)) throw new Error('Assinatura divergente.');
      // Authorization alone does not prove payment; actual charge events grant access.
      const { error: updateError } = await admin.from('mp_pedidos').update({ status: subscription.status }).eq('id', pedido.id);
      if (updateError) throw updateError;
      return NextResponse.json({ ok: true });
    }
    let paymentId = id;
    let subscriptionReference: string | undefined;
    if (tipo === 'subscription_authorized_payment') {
      const charge = await buscarPagamentoAssinaturaMercadoPago(id);
      if (!charge.payment?.id) return NextResponse.json({ ignorado: true });
      paymentId = String(charge.payment.id);
      const subscription = await buscarPreapprovalMercadoPago(String(charge.preapproval_id));
      subscriptionReference = subscription.external_reference;
      const { data: pedido, error } = await admin.from('mp_pedidos').select('mp_resource_id')
        .eq('id', subscriptionReference).maybeSingle();
      if (error || !pedido || pedido.mp_resource_id !== String(subscription.id)) throw new Error('Assinatura divergente.');
    } else if (tipo !== 'payment') return NextResponse.json({ ignorado: true });
    const payment = await buscarPagamentoMercadoPago(paymentId);
    if (String(payment.id) !== paymentId) throw new Error('Pagamento divergente.');
    if (subscriptionReference && payment.external_reference && payment.external_reference !== subscriptionReference) throw new Error('Referência divergente.');
    const reference = subscriptionReference || payment.external_reference;
    if (!reference) return NextResponse.json({ ignorado: true });
    const { data, error } = await admin.rpc('processar_mp_pagamento', {
      p_pedido: reference, p_payment_id: paymentId,
      p_status: payment.status, p_valor: payment.transaction_amount, p_currency: payment.currency_id,
    });
    if (error || data === 'pedido_desconhecido') throw new Error('Pedido não reconciliado.');
    return NextResponse.json({ ok: true, resultado: data });
  } catch {
    return NextResponse.json({ error: 'Não foi possível processar a notificação.' }, { status: 500 });
  }
}
