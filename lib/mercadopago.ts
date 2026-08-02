const MP_API = 'https://api.mercadopago.com';

interface CriarAssinaturaParams {
  email: string;
  valorParcela: number;
  parcelas: number;
  motivo: string;
  externalReference: string;
  backUrl?: string;
}

export async function criarAssinaturaMercadoPago({
  email,
  valorParcela,
  parcelas,
  motivo,
  externalReference,
  backUrl,
}: CriarAssinaturaParams): Promise<{ init_point: string; id: string }> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      'MERCADOPAGO_ACCESS_TOKEN não configurado. Adicione essa variável de ambiente para habilitar cobranças automáticas.'
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mentoria-pi-taupe.vercel.app';

  // A assinatura recorrente do Mercado Pago cobra mensalmente até a data
  // final. Calculamos essa data pra ela parar sozinha depois do número de
  // parcelas combinado (4x ou 5x), em vez de cobrar pra sempre.
  const dataFinal = new Date();
  dataFinal.setMonth(dataFinal.getMonth() + parcelas);

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
      back_url: backUrl ?? `${appUrl}/dashboard`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: valorParcela,
        currency_id: 'BRL',
        end_date: dataFinal.toISOString(),
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
  backUrl?: string;
}

export async function criarPagamentoUnicoMercadoPago({
  titulo,
  valor,
  externalReference,
  backUrl,
}: CriarPagamentoUnicoParams): Promise<{ init_point: string; id: string }> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado.');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mentoria-pi-taupe.vercel.app';
  const urlRetorno = backUrl ?? `${appUrl}/dashboard`;

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
        success: urlRetorno,
        pending: urlRetorno,
        failure: urlRetorno,
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
