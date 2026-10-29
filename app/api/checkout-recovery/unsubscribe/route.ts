import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const hex = /^[a-f0-9]{64}$/;

function validSignature(id: string, hash: string, sig: string) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !hex.test(sig)) return false;
  const expected = createHmac('sha256', secret).update('guest-recovery|' + id + '|' + hash).digest();
  const supplied = Buffer.from(sig, 'hex');
  return timingSafeEqual(expected, supplied);
}

const html = (body: string) => new NextResponse(
  '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
  '<body style="max-width:520px;padding:24px;margin:8vh auto;background:#f4f7f5;color:#173329;font:16px/1.6 Arial,sans-serif"><h1>SOMA Mentoria</h1>' +
  body + '</body></html>',
  { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }
);
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '';
  const sig = url.searchParams.get('sig') || '';
  if (!uuid.test(id) || !hex.test(sig)) return html('<p>Este link não é válido.</p>');
  // The GET method only renders the opt-out form; it does not mutate user data.
  return html('<p>Deseja parar de receber mensagens sobre esta escolha de plano?</p>' +
    '<form method="POST"><input type="hidden" name="id" value="' + id + '"><input type="hidden" name="sig" value="' + sig + '">' +
    '<button style="border:0;border-radius:25px;padding:12px 18px;background:#87ceb5;font-weight:700" type="submit">Cancelar comunicações</button></form>');
}
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return html('<p>Origem inválida.</p>');
  const data = await request.formData().catch(() => null);
  const id = data?.get('id');
  const sig = data?.get('sig');
  if (typeof id !== 'string' || !uuid.test(id) || typeof sig !== 'string' || !hex.test(sig)) return html('<p>Link inválido.</p>');
  const db = createAdminClient();
  const { data: record, error } = await db.from('soma_guest_checkout_leads')
    .select('id,email_hash').eq('id', id).maybeSingle();
  if (error || !record || !validSignature(id, record.email_hash, sig)) return html('<p>Link inválido.</p>');
  const { error: updateError } = await db.from('soma_guest_checkout_leads')
    .update({ unsubscribed_at: new Date().toISOString(), status: 'unsubscribed' }).eq('id', id);
  if (updateError) return html('<p>Não foi possível atualizar sua preferência. Tente novamente.</p>');
  return html('<p>Preferência atualizada. Você não receberá novas mensagens de recuperação deste plano.</p>');
}
