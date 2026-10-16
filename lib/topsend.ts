/**
 * Adaptador de saída para gatilho Webhook de uma automação TopSend.
 * IMPORTANTE: POST 2xx só significa que o gatilho recebeu a solicitação.
 * A entrega do WhatsApp depende de confirmação posterior do provedor.
 * O contrato de variáveis abaixo é definido pela SOMA; mapear no fluxo TopSend.
 */
export type TopSendTrigger = {
  telefone: string;
  nome: string;
  mensagem: string;
  referencia: string;
};

export function topsendPronto(): boolean {
  return process.env.TOPSEND_AUTOMATION_ENABLED === 'true' &&
    !!process.env.TOPSEND_AUTOMATION_WEBHOOK_URL;
}

export function validarUrlTopSend(endereco: string): URL {
  const url = new URL(endereco);
  if (url.protocol !== 'https:' || url.username || url.password || url.hash ||
      url.port && url.port !== '443' ||
      !(['topsend.io'].includes(url.hostname.toLowerCase()) ||
        url.hostname.toLowerCase().endsWith('.topsend.io'))) {
    throw new Error('URL do Webhook TopSend inválida. Deve ser HTTPS no domínio TopSend.');
  }
  return url;
}

export async function acionarAutomacaoTopSend(payload: TopSendTrigger): Promise<void> {
  if (!topsendPronto()) throw new Error('Automação TopSend não está habilitada.');
  if (!/^55[1-9]\d{9,10}$/.test(payload.telefone)) throw new Error('Telefone não está no padrão brasileiro.');
  if (payload.mensagem.length < 20 || payload.mensagem.length > 600) {
    throw new Error('Mensagem do acompanhamento fora dos limites permitidos.');
  }
  if (!/^SOMA_[0-9a-f]{32}$/i.test(payload.referencia)) throw new Error('Referência de acompanhamento inválida.');

  const url = validarUrlTopSend(process.env.TOPSEND_AUTOMATION_WEBHOOK_URL!);
  const token = process.env.TOPSEND_AUTOMATION_WEBHOOK_BEARER;
  const headers: Record<string,string> = {
    'Content-Type':'application/json',
    'X-Soma-Reference': payload.referencia,
  };
  if (token) headers.Authorization = 'Bearer ' + token;
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        telefone: payload.telefone,
        nome: payload.nome,
        mensagem: payload.mensagem,
        referencia: payload.referencia,
        origem: 'soma_mentoria',
      }),
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    // Pode ser timeout após o provedor ter aceitado. Não fazer retry automático.
    throw new Error('Resultado do gatilho TopSend indeterminado. Revisão humana necessária.');
  }
  if (!response.ok) {
    // Nunca expor resposta bruta ou webhook URL, pois podem conter tokens.
    throw new Error('O webhook TopSend não confirmou o recebimento (HTTP ' + response.status + ').');
  }
}
