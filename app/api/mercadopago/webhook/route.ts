import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buscarPreapprovalMercadoPago, buscarPagamentoMercadoPago } from '@/lib/mercadopago';
import { verificarAssinaturaWebhook } from '@/lib/mercadopago-webhook-security';
import { enviarEmail, templateBoasVindas } from '@/lib/sendgrid';

async function enviarBoasVindasSeNecessario(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string
) {
  const { data: perfil } = await supabase
    .from('profiles')
    .select('nome, email, boas_vindas_enviado')
    .eq('id', userId)
    .single();

  if (!perfil || perfil.boas_vindas_enviado) return;

  try {
    await enviarEmail({
      para: perfil.email,
      assunto: 'Bem-vinda à Mentoria SOMA',
      html: templateBoasVindas(perfil.nome),
    });
    await supabase.from('profiles').update({ boas_vindas_enviado: true }).eq('id', userId);
  } catch (err) {
    console.error('Falha ao enviar e-mail de boas-vindas:', err);
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const tipo = body.type ?? body.topic;
  const id = body.data?.id ?? body.id;

  if (!id) {
    return NextResponse.json({ ignorado: true });
  }

  const assinatura = verificarAssinaturaWebhook(
    request.headers.get('x-signature'),
    request.headers.get('x-request-id'),
    String(id)
  );

  if (!assinatura.valido) {
    console.error('Webhook do Mercado Pago rejeitado:', assinatura.motivo);
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Pagamento avulso (dois tipos possíveis: crédito de simulação de CV, ou
  // plano da mentoria pago à vista/cartão). Descobrimos qual é pelo
  // external_reference: se bate com um registro em pagamentos_avulsos, é
  // crédito de CV. Senão, tratamos como o próprio user_id (compra de plano).
  if (tipo === 'payment') {
    try {
      const pagamento = await buscarPagamentoMercadoPago(id);
      const referencia = pagamento.external_reference;

      if (!referencia) {
        return NextResponse.json({ ignorado: true });
      }

      const { data: registroAvulso } = await supabase
        .from('pagamentos_avulsos')
        .select('user_id, quantidade, status')
        .eq('id', referencia)
        .maybeSingle();

      if (registroAvulso) {
        if (pagamento.status === 'approved' && registroAvulso.status !== 'aprovado') {
          await supabase
            .from('pagamentos_avulsos')
            .update({ status: 'aprovado', mp_payment_id: String(id) })
            .eq('id', referencia);

          await supabase.rpc('incrementar_creditos_simulacao_cv', {
            p_user_id: registroAvulso.user_id,
            p_quantidade: registroAvulso.quantidade,
          });
        } else if (pagamento.status === 'rejected') {
          await supabase
            .from('pagamentos_avulsos')
            .update({ status: 'rejeitado', mp_payment_id: String(id) })
            .eq('id', referencia);
        }

        return NextResponse.json({ ok: true });
      }

      // Não é crédito de CV: tratamos como compra de plano (à vista ou cartão)
      const userId = referencia;

      if (pagamento.status === 'approved') {
        await supabase
          .from('profiles')
          .update({ status_assinatura: 'ativo', origem_assinatura: 'mercadopago' })
          .eq('id', userId);

        // Se esse mentorado foi indicado por alguém, marca a indicação como convertida
        const { data: perfilPago } = await supabase
          .from('profiles')
          .select('indicado_por_id')
          .eq('id', userId)
          .single();

        if (perfilPago?.indicado_por_id) {
          await supabase
            .from('indicacoes')
            .update({ status: 'convertido', convertido_em: new Date().toISOString() })
            .eq('indicado_id', userId)
            .eq('status', 'pendente');
        }

        await supabase.from('pagamentos_historico').insert({
          user_id: userId,
          valor: pagamento.transaction_amount ?? null,
          status: pagamento.status,
          mp_payment_id: String(id),
        });

        await enviarBoasVindasSeNecessario(supabase, userId);
      } else if (pagamento.status === 'rejected') {
        await supabase.from('pagamentos_historico').insert({
          user_id: userId,
          valor: pagamento.transaction_amount ?? null,
          status: pagamento.status,
          mp_payment_id: String(id),
        });
      }

      return NextResponse.json({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido.';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Assinatura recorrente (parcelas do plano)
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

    if (novoStatus === 'ativo') {
      await enviarBoasVindasSeNecessario(supabase, userId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
