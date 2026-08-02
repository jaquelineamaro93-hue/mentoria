import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { criarPreferenciaMercadoPago } from '@/lib/mercadopago';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const body = await request.json();
  const planoId: string = body.planoId;

  const { data: plano } = await supabase
    .from('planos')
    .select('*')
    .eq('id', planoId)
    .eq('ativo', true)
    .single();

  if (!plano) {
    return NextResponse.json({ error: 'Plano não encontrado.' }, { status: 404 });
  }

  const urlBase = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

  try {
    const { init_point } = await criarPreferenciaMercadoPago({
      planoTitulo: plano.titulo,
      valorCentavos: plano.valor_centavos,
      userId: user.id,
      planoId: plano.id,
      urlBase,
    });

    await supabase.from('historico_pagamentos').insert({
      user_id: user.id,
      plano_id: plano.id,
      valor_centavos: plano.valor_centavos,
      status: 'pendente',
      origem: 'automatico',
    });

    return NextResponse.json({ init_point });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
