import crypto from 'crypto';

export type IntencaoFeedback = 'progresso' | 'vaga' | 'pdi' | 'orientacao';

const INTENCOES = new Set<IntencaoFeedback>(['progresso', 'vaga', 'pdi', 'orientacao']);
const MAX_IDADE_MS = 7 * 24 * 60 * 60 * 1000;

// Usar segredo que já existe exclusivamente no backend. Nunca enviá-lo ao browser.
function assinatura(userId: string, responseId: string, intent: IntencaoFeedback, expiry: number): string {
  const segredo = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!segredo) throw new Error('Configuração de assinatura do Copiloto indisponível.');
  return crypto.createHmac('sha256', segredo)
    .update(JSON.stringify(['soma-iris-feedback-v1', userId, responseId, intent, expiry]))
    .digest('hex');
}

export function gerarComprovanteFeedback(userId: string, intent: IntencaoFeedback) {
  const responseId = crypto.randomUUID();
  const expiry = Date.now() + MAX_IDADE_MS;
  const sign = assinatura(userId, responseId, intent, expiry);
  return {
    responseId,
    feedbackToken: [responseId, intent, expiry, sign].join('.'),
  };
}

export function validarComprovanteFeedback(userId: string, token: string) {
  const partes = token.split('.');
  if (partes.length !== 4) return null;
  const [responseId, rawIntent, rawExpiry, signature] = partes;
  const intent = rawIntent as IntencaoFeedback;
  const expiry = Number(rawExpiry);
  if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(responseId)
      || !INTENCOES.has(intent)
      || !/^\d{13}$/.test(rawExpiry)
      || !Number.isSafeInteger(expiry)
      || expiry < Date.now()
      || expiry > Date.now() + MAX_IDADE_MS
      || !/^[a-f0-9]{64}$/i.test(signature)) return null;
  const esperado = Buffer.from(assinatura(userId, responseId, intent, expiry), 'hex');
  const recebido = Buffer.from(signature, 'hex');
  return recebido.length === esperado.length && crypto.timingSafeEqual(esperado, recebido)
    ? { responseId, intent }
    : null;
}
