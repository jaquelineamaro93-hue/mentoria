import type { SupabaseClient } from '@supabase/supabase-js';
import type { TrialPromptVariant } from '@/lib/types';

export const TRIAL_EXPERIMENT_KEY = 'trial_prompt_timing_v2';
export const TRIAL_MAX_DAYS = 7;

function escolherVariante(userId: string): TrialPromptVariant {
  const soma = userId.replace(/-/g, '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return soma % 2 === 0 ? 'adaptive_value' : 'fixed_day_5';
}

export async function iniciarTrialParaUsuario(
  admin: SupabaseClient,
  userId: string,
  planId: string,
  source = 'portal'
) {
  const [{ data: profile }, { data: plan }, { data: experiment }] = await Promise.all([
    admin
      .from('profiles')
      .select(
        'id,status_assinatura,origem_assinatura,trial_status,trial_started_at,trial_ends_at,trial_plan_id,trial_prompt_variant'
      )
      .eq('id', userId)
      .single(),
    admin
      .from('planos_mentoria')
      .select('id,nome,ativo,trial_enabled,trial_days')
      .eq('id', planId)
      .single(),
    admin
      .from('product_experiments')
      .select('id,status')
      .eq('key', TRIAL_EXPERIMENT_KEY)
      .maybeSingle(),
  ]);

  if (!profile) {
    return { ok: false as const, status: 404, error: 'Perfil não encontrado.' };
  }

  if (!plan || !plan.ativo || !plan.trial_enabled) {
    return { ok: false as const, status: 400, error: 'Este plano não está disponível para teste gratuito.' };
  }

  if (profile.status_assinatura === 'ativo') {
    return { ok: false as const, status: 409, error: 'Você já possui acesso ativo à SOMA.' };
  }

  if (profile.trial_status === 'converted') {
    return { ok: false as const, status: 409, error: 'Este teste já foi convertido em plano.' };
  }

  if (profile.trial_status === 'expired') {
    return { ok: false as const, status: 409, error: 'O teste gratuito já foi utilizado nesta conta.' };
  }

  if (profile.trial_status === 'active') {
    const endsAtMs = profile.trial_ends_at
      ? new Date(profile.trial_ends_at).getTime()
      : Number.NaN;

    if (Number.isFinite(endsAtMs) && endsAtMs > Date.now()) {
      return {
        ok: true as const,
        alreadyActive: true,
        trialEndsAt: profile.trial_ends_at,
        variant: profile.trial_prompt_variant as TrialPromptVariant | null,
        planId: profile.trial_plan_id,
      };
    }

    await admin
      .from('profiles')
      .update({ trial_status: 'expired' })
      .eq('id', userId)
      .eq('trial_status', 'active');

    return {
      ok: false as const,
      status: 409,
      error: 'O teste gratuito já foi utilizado nesta conta.',
    };
  }

  const trialDays = Math.max(1, Math.min(TRIAL_MAX_DAYS, Number(plan.trial_days) || TRIAL_MAX_DAYS));
  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + trialDays * 24 * 60 * 60 * 1000);
  const variant = escolherVariante(userId);

  if (experiment?.id && experiment.status === 'running') {
    await admin.from('product_experiment_assignments').upsert(
      {
        experiment_id: experiment.id,
        user_id: userId,
        variant,
      },
      { onConflict: 'experiment_id,user_id', ignoreDuplicates: true }
    );
  }

  const { data: startedProfile, error: updateError } = await admin
    .from('profiles')
    .update({
      trial_status: 'active',
      trial_started_at: startedAt.toISOString(),
      trial_ends_at: endsAt.toISOString(),
      trial_converted_at: null,
      trial_plan_id: plan.id,
      trial_prompt_variant: variant,
      trial_prompted_at: null,
      plano_id: plan.id,
    })
    .eq('id', userId)
    .eq('trial_status', 'not_started')
    .is('trial_started_at', null)
    .or('status_assinatura.is.null,status_assinatura.neq.ativo')
    .select('id')
    .maybeSingle();

  if (updateError) {
    console.error('[TRIAL] Falha ao iniciar trial:', updateError.message);
    return { ok: false as const, status: 500, error: 'Não foi possível iniciar o teste gratuito.' };
  }

  if (!startedProfile) {
    return { ok: false as const, status: 409, error: 'O teste já foi iniciado ou o acesso foi atualizado. Atualize a página.' };
  }

  await admin.from('product_events').insert({
    user_id: userId,
    event_name: 'trial_started',
    feature_key: 'trial',
    metadata: {
      source,
      plan_id: plan.id,
      plan_name: plan.nome,
      trial_days: trialDays,
      experiment_key: TRIAL_EXPERIMENT_KEY,
      variant,
    },
    dedupe_key: `${userId}:trial_started`,
    occurred_at: startedAt.toISOString(),
  });

  return {
    ok: true as const,
    alreadyActive: false,
    trialEndsAt: endsAt.toISOString(),
    variant,
    planId: plan.id,
    planName: plan.nome,
    trialDays,
  };
}


export async function marcarTrialConvertido(
  admin: SupabaseClient,
  userId: string,
  metadata: Record<string, unknown> = {}
) {
  const { data: profile } = await admin
    .from('profiles')
    .select('trial_status,trial_started_at,trial_prompt_variant,trial_plan_id')
    .eq('id', userId)
    .maybeSingle();

  if (!profile || !profile.trial_started_at || profile.trial_status === 'converted') {
    return;
  }

  const convertedAt = new Date();
  const startedAt = new Date(profile.trial_started_at);
  const elapsedHours = Math.max(
    0,
    (convertedAt.getTime() - startedAt.getTime()) / (60 * 60 * 1000)
  );
  const conversionDay = Math.max(0, Math.floor(elapsedHours / 24));

  await admin
    .from('profiles')
    .update({
      trial_status: 'converted',
      trial_converted_at: convertedAt.toISOString(),
    })
    .eq('id', userId);

  const { error: eventError } = await admin.from('product_events').insert({
    user_id: userId,
    event_name: 'trial_converted',
    feature_key: 'trial',
    metadata: {
      variant: profile.trial_prompt_variant,
      trial_plan_id: profile.trial_plan_id,
      conversion_day: conversionDay,
      conversion_hours: Math.round(elapsedHours * 10) / 10,
      ...metadata,
    },
    dedupe_key: `${userId}:trial_converted`,
    occurred_at: convertedAt.toISOString(),
  });

  if (eventError && eventError.code !== '23505') {
    console.warn('[TRIAL] Conversão salva no perfil, mas evento não foi registrado:', eventError.message);
  }
}
