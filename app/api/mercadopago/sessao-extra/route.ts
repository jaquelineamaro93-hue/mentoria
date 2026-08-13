import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { criarPagamentoUnicoMercadoPago } from '@/lib/mercadopago';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { preco, tipo } = await request.json();

  if (tipo !== 'sessao-extra' || preco !== 200) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  }

  try {
    const pagamento = await criarPagamentoUnicoMercadoPago({
      titulo: 'Sessão Individual Extra - SOMA',
      valor: preco,
      externalReference: `sessao-extra-${user.id}-${Date.now()}`,
      backUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://mentoria-pi-taupe.vercel.app'}/dashboard`,
    });

    return NextResponse.json({ init_point: pagamento.init_point });
  } catch (error) {
    console.error('Erro Mercado Pago:', error);
    const message = error instanceof Error ? error.message : 'Erro ao processar pagamento';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
