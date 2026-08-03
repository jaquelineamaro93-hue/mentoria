import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            title: 'Sessão Individual Extra - SOMA',
            quantity: 1,
            unit_price: preco,
            description: 'Sessão individual de 60 minutos com seu mentor/mentora',
          },
        ],
        payer: {
          email: user.email,
        },
        external_reference: `sessao-extra-${user.id}-${Date.now()}`,
        notification_url: `${process.env.NEXT_PUBLIC_VERCEL_URL}/api/mercadopago/webhook`,
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_VERCEL_URL}/dashboard`,
          failure: `${process.env.NEXT_PUBLIC_VERCEL_URL}/sessao-extra`,
          pending: `${process.env.NEXT_PUBLIC_VERCEL_URL}/dashboard`,
        },
        auto_return: 'approved',
      }),
    });

    const mpData = await mpResponse.json();
    return NextResponse.json({ init_point: mpData.init_point });
  } catch (error) {
    console.error('Erro Mercado Pago:', error);
    return NextResponse.json({ error: 'Erro ao processar pagamento' }, { status: 500 });
  }
}
