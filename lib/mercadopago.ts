interface CriarPreferenciaParams {
  planoTitulo: string;
  valorCentavos: number;
  userId: string;
  planoId: string;
  urlBase: string;
}

export async function criarPreferenciaMercadoPago({
  planoTitulo,
  valorCentavos,
  userId,
  planoId,
  urlBase,
}: CriarPreferenciaParams): Promise<{ init_point: string }> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      'MERCADOPAGO_ACCESS_TOKEN não configurado. Adicione essa variável de ambiente para habilitar cobranças automáticas.'
    );
  }

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          title: planoTitulo,
          quantity: 1,
          unit_price: valorCentavos / 100,
          currency_id: 'BRL',
        },
      ],
      back_urls: {
        success: `${urlBase}/assinatura?status=sucesso`,
        pending: `${urlBase}/assinatura?status=pendente`,
        failure: `${urlBase}/assinatura?status=falhou`,
      },
      auto_return: 'approved',
      notification_url: `${urlBase}/api/webhooks/mercadopago`,
      external_reference: JSON.stringify({ userId, planoId }),
    }),
  });

  if (!response.ok) {
    const detalhe = await response.text();
    throw new Error(`Erro ao criar cobrança no Mercado Pago: ${response.status} ${detalhe}`);
  }

  const data = await response.json();
  return { init_point: data.init_point };
}

export async function buscarPagamentoMercadoPago(paymentId: string) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado.');

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar pagamento no Mercado Pago: ${response.status}`);
  }

  return response.json();
}
