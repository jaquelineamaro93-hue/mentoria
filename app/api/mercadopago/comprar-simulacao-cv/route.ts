import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { criarPagamentoUnicoMercadoPago } from '@/lib/mercadopago';

const VALOR_SIMULACAO_EXTRA = 5;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  try {
    const { data: pagamento, error: erroInsert } = await supabase
      .from('pagamentos_avulsos')
      .insert({
        user_id: user.id,
        tipo: 'credito_simulacao_cv',
        quantidade: 1,
        valor: VALOR_SIMULACAO_EXTRA,
        status: 'pendente',
      })
      .select()
      .single();

    if (erroInsert) throw erroInsert;

    const pref = await criarPagamentoUnicoMercadoPago({
      titulo: 'Simulação extra de CV — Mentoria SOMA',
      valor: VALOR_SIMULACAO_EXTRA,
      externalReference: pagamento.id,
    });

    await supabase
      .from('pagamentos_avulsos')
      .update({ mp_preference_id: pref.id })
      .eq('id', pagamento.id);

    return NextResponse.json({ init_point: pref.init_point });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
