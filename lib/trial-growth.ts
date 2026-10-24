import { createHmac } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { enviarEmail } from '@/lib/sendgrid';

// Régua de conversão do trial de mentoria. Execução diária no cron protegido.
// Não altera a assinatura nem o acesso do usuário.
const TZ = 'America/Sao_Paulo';
const datePart = (date: Date) => new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
}).format(date);
function daysUntil(end: string, now: Date) {
  return Math.round((Date.parse(datePart(new Date(end)) + 'T00:00:00Z')
    - Date.parse(datePart(now) + 'T00:00:00Z')) / 86400000);
}
function safe(text: string) {
  return text.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c] || c);
}
type Stage = 'd3' | 'd1' | 'd0' | 'p2';
function buildEmail(firstName: string, stage: Stage, end: string, onboarding: boolean, optOutUrl: string) {
  const first = safe(firstName);
  const date = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ, day: '2-digit', month: 'long',
  }).format(new Date(end));
  const subjects: Record<Stage, string> = {
    d3: 'Sua jornada de carreira pode continuar na SOMA',
    d1: 'Seu teste na SOMA termina amanhã',
    d0: 'Hoje é o último dia do seu teste gratuito na SOMA',
    p2: 'O que faltou para a SOMA fazer sentido para você?',
  };
  const intro = stage === 'p2'
    ? 'Seu período gratuito terminou. Queremos saber o que faltou para a SOMA ajudar mais no seu momento profissional.'
    : 'Seu período gratuito na SOMA está chegando ao fim. Você pode continuar sua jornada de carreira com clareza, estratégia e autonomia.';
  const activation = onboarding
    ? 'Se ainda não explorou a plataforma, comece pela entrevista inicial e conheça suas próximas possibilidades.'
    : 'Continue de onde parou e transforme seus objetivos em pequenas ações consistentes.';
  const checkout = 'https://somamentoria.com/checkout';
  const html = `<div style="font:16px/1.6 Arial,sans-serif;color:#24382d;max-width:580px;margin:auto;padding:24px">
    <h2>Sua jornada merece continuidade</h2>
    <p>Oi, ${first}!</p>
    <p>${intro}</p><p>${activation}</p>
    <p>Na SOMA, você pode desenvolver seu PDI, organizar seus objetivos e acompanhar sua evolução profissional.</p>
    <p><a href="${checkout}" style="background:#276b52;color:white;padding:12px 18px;text-decoration:none;border-radius:8px">Conhecer os planos</a></p>
    ${stage === 'p2' ? '' : `<p>Seu acesso gratuito termina em ${date}.</p>`}
    <p>Se precisar de ajuda para começar, responda a este e-mail.</p>
    <p>Um abraço,<br>Jaqueline Amaro<br>Fundadora da SOMA Mentoria</p>
    <p style="font-size:12px;color:#68746a">Você recebeu este e-mail porque iniciou um teste na SOMA. <a href="${optOutUrl}">Cancelar comunicações comerciais</a>.</p>
  </div>`;
  return { subject: subjects[stage], html };
}
export async function executarTrialGrowth() {
  const summary = { sent: 0, eligible: 0, skipped: 0, errors: [] as string[] };
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    summary.errors.push('SendGrid não configurado.');
    return summary;
  }
  if (process.env.TRIAL_GROWTH_ENABLED !== 'true' || !process.env.CRON_SECRET) {
    summary.errors.push('Campanha desativada até homologação.');
    return summary;
  }
  const db = createAdminClient();
  const { data: profiles, error } = await db.from('profiles')
    .select('id,nome,email,is_admin,onboarding_concluido,trial_status,trial_ends_at,status_assinatura,status_pagamento,trial_converted_at,mp_subscription_id')
    .eq('is_admin', false).eq('trial_status', 'active').not('trial_ends_at', 'is', null);
  if (error) { summary.errors.push('Não foi possível consultar trials.'); return summary; }
  const now = new Date();
  for (const profile of profiles || []) {
    const email = (profile.email || '').trim().toLowerCase();
    if (!email || !profile.trial_ends_at || profile.status_assinatura === 'ativo'
      || profile.status_pagamento === 'ativo' || profile.trial_converted_at || profile.mp_subscription_id
      || email.includes('jaqueline') || email.includes('+teste')
      || email.includes('+test') || email.endsWith('@example.com')) {
      summary.skipped++; continue;
    }
    const days = daysUntil(profile.trial_ends_at, now);
    const stage: Stage | null = days === 3 ? 'd3' : days === 1 ? 'd1'
      : days === 0 ? 'd0' : days === -2 ? 'p2' : null;
    if (!stage || (stage === 'd0' && now >= new Date(profile.trial_ends_at))) { summary.skipped++; continue; }
    // A campanha não deve incluir clientes com qualquer módulo SaaS pago.
    const { data: paidModules, error: moduleError } = await db.from('soma_module_subscriptions')
      .select('id').eq('user_id', profile.id).in('status', ['active','ativo','authorized','paid']).limit(1);
    if (moduleError || paidModules?.length) { summary.skipped++; continue; }
    const { data: optOut, error: optError } = await db.from('trial_growth_opt_out')
      .select('user_id').eq('user_id',profile.id).maybeSingle();
    if (optError || optOut) { summary.skipped++; continue; }
    summary.eligible++;
    const type = 'trial_growth_' + stage;
    const { data: logged, error: logCheckError } = await db.from('emails_enviados')
      .select('id').eq('user_id', profile.id).eq('tipo', type).limit(1);
    if (logCheckError) { summary.errors.push('Falha no controle de duplicidade.'); continue; }
    if (logged?.length) { summary.skipped++; continue; }
    const { data: fresh, error: freshError } = await db.from('profiles')
      .select('trial_status,status_assinatura,status_pagamento,trial_converted_at,mp_subscription_id')
      .eq('id', profile.id).single();
    if (freshError || !fresh || fresh.trial_status !== 'active'
      || fresh.status_assinatura === 'ativo' || fresh.status_pagamento === 'ativo'
      || fresh.trial_converted_at || fresh.mp_subscription_id) {
      summary.skipped++; continue;
    }
    const firstName = (profile.nome || 'Olá').trim().split(/\s+/)[0];
    // Reserva atômica: unique(user_id,stage) impede concorrência.
    const { error: reservationError } = await db.from('trial_growth_dispatches')
      .insert({user_id:profile.id,stage,status:'reserved'});
    if (reservationError) { summary.skipped++; continue; }
    const signature = createHmac('sha256', process.env.CRON_SECRET).update(profile.id).digest('hex');
    const optOutUrl = 'https://somamentoria.com/api/trial-growth/unsubscribe?u=' +
      encodeURIComponent(profile.id) + '&sig=' + signature;
    const msg = buildEmail(firstName, stage, profile.trial_ends_at, !profile.onboarding_concluido, optOutUrl);
    const accepted = await enviarEmail({ to: email, subject: msg.subject, html: msg.html });
    if (!accepted) {
      await db.from('trial_growth_dispatches').delete().eq('user_id',profile.id).eq('stage',stage).eq('status','reserved');
      summary.errors.push('SendGrid rejeitou um envio.'); continue;
    }
    await db.from('trial_growth_dispatches').update({status:'sent',sent_at:new Date().toISOString()})
      .eq('user_id',profile.id).eq('stage',stage);
    const { error: writeError } = await db.from('emails_enviados')
      .insert({ user_id: profile.id, tipo: type });
    if (writeError) summary.errors.push('Email enviado, mas falha ao registrar deduplicação.');
    summary.sent++;
  }
  return summary;
}
