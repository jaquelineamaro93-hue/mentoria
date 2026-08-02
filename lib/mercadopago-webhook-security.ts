import crypto from 'crypto';

/**
 * Verifica se uma notificação de webhook realmente veio do Mercado Pago,
 * usando o segredo configurado no painel deles (Webhooks → chave secreta).
 *
 * Sem essa checagem, qualquer pessoa poderia mandar um POST fake pro nosso
 * webhook fingindo que um pagamento foi aprovado.
 */
export function verificarAssinaturaWebhook(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string | null
): { valido: boolean; motivo?: string } {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  if (!secret) {
    // Sem o segredo configurado ainda, não bloqueia (pra não quebrar o que já
    // está no ar), mas isso deveria ser corrigido assim que possível.
    return { valido: true, motivo: 'MERCADOPAGO_WEBHOOK_SECRET não configurado, checagem pulada' };
  }

  if (!xSignature || !xRequestId || !dataId) {
    return { valido: false, motivo: 'Cabeçalhos de assinatura ausentes' };
  }

  const partes: Record<string, string> = {};
  xSignature.split(',').forEach((parte) => {
    const [chave, valor] = parte.split('=');
    if (chave && valor) partes[chave.trim()] = valor.trim();
  });

  const ts = partes['ts'];
  const hashRecebido = partes['v1'];
  if (!ts || !hashRecebido) {
    return { valido: false, motivo: 'Formato de x-signature inesperado' };
  }

  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
  const hashCalculado = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  try {
    const bufRecebido = Buffer.from(hashRecebido);
    const bufCalculado = Buffer.from(hashCalculado);
    if (bufRecebido.length !== bufCalculado.length) {
      return { valido: false, motivo: 'Hash com tamanho diferente' };
    }
    const iguais = crypto.timingSafeEqual(bufRecebido, bufCalculado);
    return { valido: iguais, motivo: iguais ? undefined : 'Hash não confere' };
  } catch {
    return { valido: false, motivo: 'Erro ao comparar hash' };
  }
}
