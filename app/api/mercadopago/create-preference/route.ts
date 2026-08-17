import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: body.items,
        payer: body.payer,
        external_reference: body.external_reference,
        notification_url: body.notification_url,
        binary_mode: body.binary_mode,
        statement_descriptor: body.statement_descriptor,
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_SITE_URL}/payment-success`,
          failure: `${process.env.NEXT_PUBLIC_SITE_URL}/payment-failure`,
          pending: `${process.env.NEXT_PUBLIC_SITE_URL}/payment-pending`,
        },
        auto_return: 'approved',
      }),
    });

    const preference = await response.json();
    return Response.json(preference);
  } catch (error) {
    console.error('Erro ao criar preferência:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
