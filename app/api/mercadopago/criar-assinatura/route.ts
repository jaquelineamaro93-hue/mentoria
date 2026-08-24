import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { criarAssinaturaMercadoPago, criarPagamentoUnicoMercadoPago } from '@/lib/mercadopago';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await request.json();
  const planoCodigo: string = body.planoCodigo;
  const formaPagamento: 'avista' | 'cartao' | 'recorrente' = body.formaPagamento;

  if (!planoCodigo || !formaPagamento) {
    return NextResponse.json({ error: 'Plano ou forma de pagamento não informados.' }, { status: 400 });
  }

  const { data: plano } = await supabase
    .from('planos_mentoria')
    .select('*')
    .eq('codigo', planoCodigo)
    .eq('ativo', true)
    .single();

  if (!plano) {
    return NextResponse.json({ error: 'Plano não encontrado.' }, { status: 404 });
  }

  let userEmail = 'cliente@somamentoria.com';
  let userId = user?.id;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nome, email')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 });
    }

    userEmail = profile.email;

    // Guarda a escolha do plano e forma de pagamento, pra sabermos o que
    // ativar quando o webhook confirmar o pagamento.
    await supabase
      .from('profiles')
      .update({ plano_id: plano.id, forma_pagamento_escolhida: formaPagamento })
      .eq('id', user.id);
  }

  try {

    if (formaPagamento === 'recorrente') {
      const valorParcela = Number(plano.preco_recorrente_total) / plano.parcelas_recorrente;

      const assinatura = await criarAssinaturaMercadoPago({
        email: userEmail,
        valorParcela,
        parcelas: plano.parcelas_recorrente,
        motivo: `${plano.nome} — Mentoria SOMA (${plano.parcelas_recorrente}x)`,
        externalReference: userId || 'guest',
      });

      if (user) {
        await supabase
          .from('profiles')
          .update({ mp_subscription_id: assinatura.id })
          .eq('id', user.id);
      }

      return NextResponse.json({ init_point: assinatura.init_point });
    }

    const valor = formaPagamento === 'avista' ? plano.preco_avista : plano.preco_cartao;

    const pagamento = await criarPagamentoUnicoMercadoPago({
      titulo: `${plano.nome} — Mentoria SOMA (${formaPagamento === 'avista' ? 'à vista' : 'cartão'})`,
      valor,
      externalReference: userId || 'guest',
    });

    return NextResponse.json({ init_point: pagamento.init_point });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
