import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buscarPagamentoMercadoPago } from '@/lib/mercadopago';

export async function POST(request: Request) {
  const body = await request.json();

  // Mercado Pago manda vários formatos de notificação, o mais comum é
  // { type: 'payment', data: { id: '...' } }
  const paymentId: string | undefined = body?.data?.id;

  if (!paymentId) {
    return NextResponse.json({ ok: true });
  }

  try {
    const pagamento = await buscarPagamentoMercadoPago(paymentId);
    const referencia = JSON.parse(pagamento.external_reference ?? '{}');
    const userId: string | undefined = referencia.userId;
    const planoId: string | undefined = referencia.planoId;

    if (!userId) {
      return NextResponse.json({ ok: true });
    }

    const supabase = createAdminClient();

    if (pagamento.status === 'approved') {
      const { data: plano } = await supabase
        .from('planos')
        .select('duracao_dias')
        .eq('id', planoId)
        .single();

      const diasAcesso = plano?.duracao_dias ?? 30;
      const novaDataFim = new Date(Date.now() + diasAcesso * 86400000)
        .toISOString()
        .slice(0, 10);

      await supabase
        .from('profiles')
        .update({ status_pagamento: 'ativo', data_fim_acesso: novaDataFim })
        .eq('id', userId);

      await supabase
        .from('historico_pagamentos')
        .update({ status: 'aprovado', provedor_pagamento_id: String(paymentId) })
        .eq('user_id', userId)
        .eq('plano_id', planoId)
        .eq('status', 'pendente');
    } else if (pagamento.status === 'rejected') {
      await supabase
        .from('historico_pagamentos')
        .update({ status: 'rejeitado', provedor_pagamento_id: String(paymentId) })
        .eq('user_id', userId)
        .eq('plano_id', planoId)
        .eq('status', 'pendente');
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Erro no webhook do Mercado Pago:', err);
    return NextResponse.json({ ok: true });
  }
}
