import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const FEATURES_DE_VALOR_EXCLUIDAS = new Set([
  'dashboard',
  'meu_plano',
  'passaporte',
  'onboarding',
]);

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ state: null }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select(
      'trial_status,trial_started_at,trial_ends_at,trial_plan_id,trial_prompt_variant,trial_prompted_at,status_assinatura'
    )
    .eq('id', user.id)
    .single();

  if (!profile || profile.status_assinatura === 'ativo' || profile.trial_status === 'converted') {
    return NextResponse.json(
      { state: null },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  if (!profile.trial_started_at || !profile.trial_ends_at || !profile.trial_plan_id) {
    return NextResponse.json(
      { state: null },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  const agora = Date.now();
  const inicio = new Date(profile.trial_started_at).getTime();
  const fim = new Date(profile.trial_ends_at).getTime();

  if (profile.trial_status === 'active' && fim <= agora) {
    await admin
      .from('profiles')
      .update({ trial_status: 'expired' })
      .eq('id', user.id)
      .eq('trial_status', 'active');

    const { error: expiredEventError } = await admin.from('product_events').insert({
      user_id: user.id,
      event_name: 'trial_expired',
      feature_key: 'trial',
      metadata: {
        variant: profile.trial_prompt_variant,
        trial_plan_id: profile.trial_plan_id,
      },
      dedupe_key: `${user.id}:trial_expired`,
    });

    if (expiredEventError && expiredEventError.code !== '23505') {
      console.warn('[TRIAL] Não foi possível registrar expiração:', expiredEventError.message);
    }

    return NextResponse.json(
      { state: { status: 'expired' } },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  if (profile.trial_status !== 'active') {
    return NextResponse.json(
      { state: null },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  const [{ data: plan }, { data: views }] = await Promise.all([
    admin
      .from('planos_mentoria')
      .select('id,nome,trial_days')
      .eq('id', profile.trial_plan_id)
      .maybeSingle(),
    admin
      .from('product_events')
      .select('feature_key')
      .eq('user_id', user.id)
      .eq('event_name', 'feature_view')
      .gte('occurred_at', profile.trial_started_at),
  ]);

  const coreFeatures = new Set(
    (views ?? [])
      .map((item) => item.feature_key as string | null)
      .filter((key): key is string => Boolean(key) && !FEATURES_DE_VALOR_EXCLUIDAS.has(key!))
  );

  const elapsedDays = Math.max(0, Math.floor((agora - inicio) / 86400000));
  const daysLeft = Math.max(0, Math.ceil((fim - agora) / 86400000));
  const variant = profile.trial_prompt_variant || 'adaptive_value';

  const shouldPrompt =
    variant === 'fixed_day_7'
      ? elapsedDays >= 7
      : (elapsedDays >= 2 && coreFeatures.size >= 2) || elapsedDays >= 12;

  return NextResponse.json(
    {
      state: {
        status: 'active',
        planId: profile.trial_plan_id,
        planName: plan?.nome ?? 'SOMA',
        trialDays: Number(plan?.trial_days ?? 15),
        startedAt: profile.trial_started_at,
        endsAt: profile.trial_ends_at,
        elapsedDays,
        daysLeft,
        distinctCoreFeatures: coreFeatures.size,
        variant,
        shouldPrompt,
        promptedAt: profile.trial_prompted_at,
      },
    },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
