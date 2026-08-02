const MP_API = 'https://api.mercadopago.com';

interface CriarAssinaturaParams {
  email: string;
  valor: number;
  motivo: string;
  externalReference: string;
}

export async function criarAssinaturaMercadoPago({
  email,
  valor,
  motivo,
  externalReference,
}: CriarAssinaturaParams): Promise<{ init_point: string; id: string }> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      'MERCADOPAGO_ACCESS_TOKEN não configurado. Adicione essa variável de ambiente para habilitar cobranças automáticas.'
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mentoria-pi-taupe.vercel.app';

  const response = await fetch(`${MP_API}/preapproval`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason: motivo,
      external_reference: externalReference,
      payer_email: email,
      back_url: `${appUrl}/dashboard`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: valor,
        currency_id: 'BRL',
      },
      status: 'pending',
    }),
  });

  if (!response.ok) {
    const detalhe = await response.text();
    throw new Error(`Erro ao criar assinatura no Mercado Pago: ${response.status} ${detalhe}`);
  }

  const data = await response.json();
  return { init_point: data.init_point, id: data.id };
}

interface CriarPagamentoUnicoParams {
  titulo: string;
  valor: number;
  externalReference: string;
}

export async function criarPagamentoUnicoMercadoPago({
  titulo,
  valor,
  externalReference,
}: CriarPagamentoUnicoParams): Promise<{ init_point: string; id: string }> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado.');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mentoria-pi-taupe.vercel.app';

  const response = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          title: titulo,
          quantity: 1,
          unit_price: valor,
          currency_id: 'BRL',
        },
      ],
      external_reference: externalReference,
      back_urls: {
        success: `${appUrl}/simulador-cv`,
        pending: `${appUrl}/simulador-cv`,
        failure: `${appUrl}/simulador-cv`,
      },
      auto_return: 'approved',
    }),
  });

  if (!response.ok) {
    const detalhe = await response.text();
    throw new Error(`Erro ao criar pagamento no Mercado Pago: ${response.status} ${detalhe}`);
  }

  const data = await response.json();
  return { init_point: data.init_point, id: data.id };
}

export async function buscarPagamentoMercadoPago(id: string) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado.');

  const response = await fetch(`${MP_API}/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar pagamento no Mercado Pago: ${response.status}`);
  }

  return response.json();
}

export async function buscarPreapprovalMercadoPago(id: string) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado.');

  const response = await fetch(`${MP_API}/preapproval/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar assinatura no Mercado Pago: ${response.status}`);
  }

  return response.json();
}
