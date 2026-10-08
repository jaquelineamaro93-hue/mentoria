import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { criarPagamentoUnicoMercadoPago } from '@/lib/mercadopago';
import { registrarPedido, vincularCobranca } from '@/lib/mercadopago-orders';
import { consumeSecurityRateLimit } from '@/lib/security/rate-limit';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

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

  try {
    const pedido = await registrarPedido({ user_id: user.id, email: user.email,
      tipo: 'credito_simulacao_cv', valor: 5, forma_pagamento: 'avista' });
    const pagamento = await criarPagamentoUnicoMercadoPago({
      titulo: 'Simulação extra de CV — Mentoria SOMA', valor: 5, externalReference: pedido.id,
    });
    await vincularCobranca(pedido.admin, pedido.id, pagamento.id);
    return NextResponse.json({ init_point: pagamento.init_point });
  } catch {
    return NextResponse.json({ error: 'Não foi possível iniciar o pagamento.' }, { status: 500 });
  }
}
