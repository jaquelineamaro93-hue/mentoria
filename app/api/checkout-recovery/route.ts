import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { consumeSecurityRateLimit } from '@/lib/security/rate-limit';
import { sendEmail } from '@/lib/sendgrid';
import { SAAS_MODULES } from '@/lib/saas-access';
import { BASE_SAAS_CENTAVOS } from '@/lib/soma-saas-pricing';

export const dynamic = 'force-dynamic';

const response = (payload: object, status = 200) =>
  NextResponse.json(payload, { status, headers: { 'Cache-Control': 'private, no-store' } });
const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidRx = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function emailHash(email: string): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Secure hashing unavailable');
  return createHmac('sha256', key).update('soma-guest-recovery|' + email).digest('hex');
}

export function guestRecoverySignature(id: string, hash: string): string {
  const key = process.env.CRON_SECRET;
  if (!key) throw new Error('Unsubscribe secret missing');
  return createHmac('sha256', key).update('guest-recovery|' + id + '|' + hash).digest('hex');
}

export function verifyGuestRecoverySignature(id: string, hash: string, signature: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(signature)) return false;
  const actual = Buffer.from(signature, 'hex');
  const expected = Buffer.from(guestRecoverySignature(id, hash), 'hex');
  return timingSafeEqual(actual, expected);
}

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !token || token.length > 2048) return false;
  const form = new URLSearchParams({ secret, response: token });
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
      cache: 'no-store',
      signal: AbortSignal.timeout(9000),
    });
    const result = await r.json() as { success?: boolean; hostname?: string };
    if (!r.ok || result.success !== true) return false;
    // A verification can only be used for the configured SOMA domains.
    const hostname = (result.hostname || '').toLowerCase();
    return hostname === 'somamentoria.com'
      || hostname === 'www.somamentoria.com'
      || hostname.endsWith('.vercel.app')
      || (process.env.NODE_ENV !== 'production' && hostname === 'localhost');
  } catch { return false; }
}

function recoveryEmail(product: 'plataforma'|'carreira', url: string, optOut: string, expires: string) {
  const isPlatform = product === 'plataforma';
  const offerText = isPlatform
    ? '<p>Se o preço pesou na decisão, você pode solicitar uma análise de <strong>10% na primeira mensalidade da SOMA Plataforma</strong>. A condição depende de confirmação pela equipe e <strong>não é aplicada automaticamente no checkout</strong>. Os adicionais de IA não têm desconto.</p>'
    : '<p>Se a decisão ficou para depois, a equipe pode conversar sobre modalidades e opções de pagamento. Nenhuma condição especial foi aplicada ao plano de mentoria.</p>';
  const html = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"></head><body style="font:16px/1.65 Arial,sans-serif;background:#f2f6f3;color:#142a22;margin:0;padding:24px">' +
    '<div style="max-width:560px;margin:0 auto;background:white;border-radius:18px;overflow:hidden">' +
    '<div style="background:#10241d;color:white;padding:26px"><strong style="font-size:24px">SOMA <i style="color:#8fd3be">Mentoria</i></strong><h1 style="font-size:26px;line-height:1.2;margin:24px 0 0">Sua escolha continua aqui</h1></div>' +
    '<div style="padding:24px"><p>Você estava conhecendo ' + (isPlatform ? 'a SOMA Plataforma' : 'a SOMA Carreira') + ' e decidiu deixar a contratação para depois.</p>' +
    '<p>Guardamos o caminho de volta para você continuar quando quiser.</p>' +
    offerText +
    '<p><a href="' + url + '" style="display:inline-block;border-radius:40px;background:#8fd3be;color:#10241d;font-weight:700;padding:13px 20px;text-decoration:none">Retomar minha escolha</a></p>' +
    (isPlatform ? '<p>Para solicitar a avaliação dos 10%, responda a este e-mail até ' + expires + ', horário de Brasília. Nenhuma cobrança será feita antes de você confirmar o preço no checkout.</p>' : '') +
    '<p>Um abraço,<br>Equipe SOMA Mentoria</p><hr style="border:0;border-top:1px solid #e0e8e1">' +
    '<p style="font-size:12px;color:#66776d">Você autorizou receber este link ao sair do checkout. <a href="' + optOut + '">Cancelar comunicações relacionadas a esta escolha</a>.</p></div></div></body></html>';
  return { subject: 'SOMA: seu plano ficou guardado para continuar depois', html };
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return response({ error: 'Origem inválida.' }, 403);
  const allowed = await consumeSecurityRateLimit({ request, scope: 'guest_checkout_recovery', limit: 4, windowSeconds: 3600 });
  if (!allowed) return response({ error: 'Muitas solicitações. Tente novamente mais tarde.' }, 429);

  let payload: Record<string, unknown>;
  try { payload = await request.json(); } catch { return response({ error: 'Pedido inválido.' }, 400); }
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const product = payload.product === 'plataforma' ? 'plataforma' : payload.product === 'carreira' ? 'carreira' : null;
  const planCode = typeof payload.planCode === 'string' ? payload.planCode : '';
  const moduleSlug = typeof payload.moduleSlug === 'string' ? payload.moduleSlug : '';
  const iris = payload.iris === true;
  const whatsapp = payload.whatsapp === true;
  if (!emailRx.test(email) || email.length > 254 || !product || payload.consent !== true || planCode.length > 100) {
    return response({ error: 'Confira o e-mail, o plano e a autorização.' }, 400);
  }
  if (!await verifyTurnstile(String(payload.turnstileToken || ''))) {
    return response({ error: 'Não foi possível validar a verificação de segurança. Tente novamente.' }, 403);
  }
  const db = createAdminClient();
  let returnPath: string;
  if (product === 'plataforma') {
    if (!(planCode in BASE_SAAS_CENTAVOS) || (moduleSlug && !SAAS_MODULES.includes(moduleSlug as typeof SAAS_MODULES[number]))) {
      return response({ error: 'Plano inválido.' }, 400);
    }
    const query = new URLSearchParams({ plano: planCode, modulo: moduleSlug, iris: iris ? '1' : '0', whatsapp: whatsapp ? '1' : '0' });
    returnPath = '/plataforma?' + query.toString();
  } else {
    if (!uuidRx.test(planCode)) return response({ error: 'Plano inválido.' }, 400);
    const { data: plan, error } = await db.from('planos_mentoria').select('id').eq('id', planCode).eq('ativo', true).eq('visivel_checkout', true).maybeSingle();
    if (error || !plan) return response({ error: 'Plano indisponível.' }, 409);
    returnPath = '/checkout?plan=' + encodeURIComponent(planCode);
  }

  // Do not send a new-customer promotion to existing paying customers.
  const { data: profiles, error: profileError } = await db.from('profiles')
    .select('id,status_assinatura,status_pagamento,trial_converted_at')
    .ilike('email', email).limit(3);
  if (profileError) return response({ error: 'Não foi possível conferir a solicitação.' }, 503);
  if ((profiles || []).some(p => p.status_assinatura === 'ativo' || p.status_pagamento === 'ativo' || p.trial_converted_at)) {
    return response({ ok: true });
  }
  if (profiles?.length) {
    const { data: active, error: activeError } = await db.from('soma_module_subscriptions').select('id')
      .in('user_id', profiles.map(p => p.id)).in('status', ['active', 'ativo', 'paid', 'authorized']).limit(1);
    if (activeError) return response({ error: 'Não foi possível conferir a solicitação.' }, 503);
    if (active?.length) return response({ ok: true });
  }

  const hash = emailHash(email);
  const { data: previous, error: existingError } = await db.from('soma_guest_checkout_leads')
    .select('id,status,offer_expires_at,unsubscribed_at,email_hash').eq('email_hash', hash).eq('product', product).maybeSingle();
  if (existingError) return response({ error: 'Não foi possível consultar o pedido.' }, 503);
  if (previous?.unsubscribed_at || (previous && Date.parse(previous.offer_expires_at) < Date.now())) return response({ ok: true });
  if (previous?.status === 'sent' || previous?.status === 'reserved') return response({ ok: true });

  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  let record = previous;
  if (!record) {
    const inserted = await db.from('soma_guest_checkout_leads').insert({
      email, email_hash: hash, product, plan_code: planCode, module_slug: moduleSlug || null,
      iris, whatsapp, return_path: returnPath, status: 'reserved', consent_at: now.toISOString(),
      offer_expires_at: expires.toISOString(),
    }).select('id,status,offer_expires_at,email_hash').single();
    if (inserted.error || !inserted.data) return response({ error: 'Não foi possível guardar a escolha.' }, 503);
    record = inserted.data;
  }

  const baseUrl = 'https://somamentoria.com';
  const returnUrl = baseUrl + returnPath;
  const signature = guestRecoverySignature(record.id, record.email_hash);
  const optOutUrl = baseUrl + '/api/checkout-recovery/unsubscribe?id=' + encodeURIComponent(record.id) + '&sig=' + signature;
  const endText = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }).format(new Date(record.offer_expires_at));
  const emailContent = recoveryEmail(product, returnUrl, optOutUrl, endText);
  const sent = await sendEmail({ to: email, subject: emailContent.subject, html: emailContent.html });
  await db.from('soma_guest_checkout_leads').update({ status: sent ? 'sent' : 'send_failed', sent_at: sent ? new Date().toISOString() : null }).eq('id', record.id);
  if (!sent) return response({ error: 'Não foi possível enviar o e-mail agora. Tente novamente.' }, 503);
  return response({ ok: true });
}
