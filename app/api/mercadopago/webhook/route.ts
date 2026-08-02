import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buscarPreapprovalMercadoPago, buscarPagamentoMercadoPago } from '@/lib/mercadopago';

export async function POST(request: Request) {
  const body = await request.json();
  const tipo = body.type ?? body.topic;
  const id = body.data?.id ?? body.id;

  if (!id) {
    return NextResponse.json({ ignorado: true });
  }

  const supabase = createAdminClient();

  // Pagamento avulso (créditos de simulação de CV)
  if (tipo === 'payment') {
    try {
      const pagamento = await buscarPagamentoMercadoPago(id);
      const pagamentoAvulsoId = pagamento.external_reference;

      if (!pagamentoAvulsoId) {
        return NextResponse.json({ ignorado: true });
      }

      const { data: registro } = await supabase
        .from('pagamentos_avulsos')
        .select('user_id, quantidade, status')
        .eq('id', pagamentoAvulsoId)
        .single();

      if (!registro) {
        return NextResponse.json({ erro: 'Registro de pagamento avulso não encontrado' }, { status: 404 });
      }

      if (pagamento.status === 'approved' && registro.status !== 'aprovado') {
        await supabase
          .from('pagamentos_avulsos')
          .update({ status: 'aprovado', mp_payment_id: String(id) })
          .eq('id', pagamentoAvulsoId);

        await supabase.rpc('incrementar_creditos_simulacao_cv', {
          p_user_id: registro.user_id,
          p_quantidade: registro.quantidade,
        });
      } else if (pagamento.status === 'rejected') {
        await supabase
          .from('pagamentos_avulsos')
          .update({ status: 'rejeitado', mp_payment_id: String(id) })
          .eq('id', pagamentoAvulsoId);
      }

      return NextResponse.json({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido.';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Assinatura recorrente (mensalidade)
  if (tipo !== 'preapproval') {
    return NextResponse.json({ ignorado: true });
  }

  try {
    const preapproval = await buscarPreapprovalMercadoPago(id);
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
