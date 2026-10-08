import { registrarPedido, vincularCobranca } from '@/lib/mercadopago-orders';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { criarAssinaturaMercadoPago, criarPagamentoUnicoMercadoPago } from '@/lib/mercadopago';
import { consumeSecurityRateLimit } from '@/lib/security/rate-limit';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Entre na sua conta antes de pagar.' }, { status: 401 });
  }

  const allowed = await consumeSecurityRateLimit({
    request,
    scope: 'payment_create',
    identifier: user.id,
    limit: 10,
    windowSeconds: 15 * 60,
  });

  if (!allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas de pagamento. Aguarde alguns minutos.' },
      { status: 429 }
    );
  }
  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }
  const planoCodigo = body?.planoCodigo;
  const formaPagamento = body?.formaPagamento;
  if (typeof planoCodigo !== 'string' || !['avista', 'cartao', 'recorrente'].includes(formaPagamento)) {
    return NextResponse.json({ error: 'Plano ou forma de pagamento inválidos.' }, { status: 400 });
  }
  const email = user.email;
  const userId = user.id;

  const { data: plano } = await supabase
    .from('planos_mentoria')
    .select('*')
    .eq('codigo', planoCodigo)
    .eq('ativo', true)
    .single();

  if (!plano) {
    return NextResponse.json({ error: 'Plano não encontrado.' }, { status: 404 });
  }

  try {
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 });
    }
    const parcelas = Number(plano.parcelas_recorrente);
    if (formaPagamento === 'recorrente' && (!Number.isInteger(parcelas) || parcelas < 1)) {
      throw new Error('Parcelamento inválido.');
    }
    const valorPedido = formaPagamento === 'recorrente'
      ? Math.round(Number(plano.preco_recorrente_total) / parcelas * 100) / 100
      : Number(formaPagamento === 'avista' ? plano.preco_avista : plano.preco_cartao);
    const pedido = await registrarPedido({ user_id: userId || null, email, tipo: 'plano',
      valor: valorPedido, plano_id: plano.id, forma_pagamento: formaPagamento });
    const externalReference = pedido.id;

    if (formaPagamento === 'recorrente') {
      const valorParcela = valorPedido;

      const assinatura = await criarAssinaturaMercadoPago({
        email,
        valorParcela,
        parcelas: plano.parcelas_recorrente,
        motivo: `${plano.nome} — Mentoria SOMA (${plano.parcelas_recorrente}x)`,
        externalReference,
      });

      await vincularCobranca(pedido.admin, pedido.id, assinatura.id);

      return NextResponse.json({ init_point: assinatura.init_point });
    }

    const valor = valorPedido;

    const pagamento = await criarPagamentoUnicoMercadoPago({
      titulo: `${plano.nome} — Mentoria SOMA (${formaPagamento === 'avista' ? 'à vista' : 'cartão'})`,
      valor,
      externalReference,
    });

    await vincularCobranca(pedido.admin, pedido.id, pagamento.id);
    return NextResponse.json({ init_point: pagamento.init_point });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
