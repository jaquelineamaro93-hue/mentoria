import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { criarAssinaturaMercadoPago } from '@/lib/mercadopago';

const VALOR_MENSALIDADE = 497;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, email')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 });
  }

  try {
    const assinatura = await criarAssinaturaMercadoPago({
      email: profile.email,
      valor: VALOR_MENSALIDADE,
      motivo: 'Mentoria SOMA — mensalidade',
      externalReference: user.id,
    });

    await supabase
      .from('profiles')
      .update({ mp_subscription_id: assinatura.id })
      .eq('id', user.id);

    return NextResponse.json({ init_point: assinatura.init_point });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
