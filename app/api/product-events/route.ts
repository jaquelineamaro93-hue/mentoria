import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const EVENTOS_PERMITIDOS = new Set([
  'feature_view',
  'trial_prompt_view',
  'trial_upgrade_click',
  'checkout_started',
]);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        eventName?: string;
        featureKey?: string | null;
        path?: string | null;
        sessionId?: string | null;
        metadata?: Record<string, unknown>;
        dedupeKey?: string | null;
      }
    | null;

  const eventName = body?.eventName?.trim();
  if (!eventName || !EVENTOS_PERMITIDOS.has(eventName)) {
    return NextResponse.json({ error: 'Evento inválido.' }, { status: 400 });
  }

  const dedupeKey = body?.dedupeKey?.trim()
    ? `${user.id}:${body.dedupeKey.trim().slice(0, 180)}`
    : null;

  const payload = {
    user_id: user.id,
    event_name: eventName,
    feature_key: body?.featureKey?.trim().slice(0, 100) || null,
    path: body?.path?.trim().slice(0, 300) || null,
    session_id: body?.sessionId?.trim().slice(0, 100) || null,
    metadata: body?.metadata && typeof body.metadata === 'object' ? body.metadata : {},
    dedupe_key: dedupeKey,
  };

  const { error } = await supabase.from('product_events').insert(payload);

  if (!error && eventName === 'trial_prompt_view') {
    await createAdminClient()
      .from('profiles')
      .update({ trial_prompted_at: new Date().toISOString() })
      .eq('id', user.id)
      .is('trial_prompted_at', null);
  }

  if (error) {
    if (error.code === '23505' && dedupeKey) {
      return new NextResponse(null, {
        status: 204,
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }

    console.error('[PRODUCT-EVENTS] Falha ao registrar evento:', error.message);
    return NextResponse.json({ error: 'Não foi possível registrar o evento.' }, { status: 500 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
