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
export function trialGrowthStage(status: string, days: number): Stage | null {
  if (status === 'expired') return days <= -2 && days >= -14 ? 'p2' : null;
  if (status !== 'active') return null;
  return days === 3 ? 'd3' : days === 1 ? 'd1' : days === 0 ? 'd0'
    : days <= -2 && days >= -14 ? 'p2' : null;
}
function buildEmail(firstName: string, stage: Stage, end: string, onboarding: boolean, hasInterview: boolean, optOutUrl: string) {
  const first = safe(firstName);
  const date = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ, day: '2-digit', month: 'long',
  }).format(new Date(end));
  const subjects: Record<Stage, string> = {
    d3: 'Você ainda pode aproveitar seu teste gratuito na SOMA',
    d1: 'Seu teste SOMA termina amanhã: escolha seu próximo passo',
    d0: 'Seu teste gratuito da SOMA termina hoje',
    p2: 'Qual é o próximo passo da sua carreira?',
  };
  const intro = stage === 'd3'
    ? 'Seu teste gratuito está chegando ao fim. Antes de decidir como continuar, reserve alguns minutos para descobrir o que a SOMA pode ajudar você a desenvolver na carreira.'
    : stage === 'd1'
      ? 'Seu teste termina amanhã. Vale escolher agora como você quer continuar seu desenvolvimento profissional, com clareza sobre seus objetivos e as ferramentas que vão ajudar nessa jornada.'
      : stage === 'd0'
        ? 'Seu período gratuito termina hoje, no horário previsto para sua conta. Se quiser continuar, conheça os planos antes do encerramento do acesso.'
        : 'Seu teste gratuito terminou, mas você pode continuar trabalhando no seu próximo passo profissional. O que faz mais sentido agora: buscar uma nova oportunidade ou crescer onde está?';
  const activation = onboarding
    ? hasInterview
      ? 'Você já deu o primeiro passo com a sua entrevista inicial. Agora pode explorar as próximas atividades e organizar o que faz mais sentido para sua carreira.'
      : 'Sua entrevista inicial ainda não está registrada. Esse é um bom primeiro passo para dar direção à sua jornada na SOMA.'
    : 'Você já iniciou sua jornada. Agora é a hora de transformar seus objetivos em ações consistentes.';
  const params = (action: string) => 'utm_source=sendgrid&utm_medium=email&utm_campaign=soma_trial_growth&utm_content=' + stage + '_' + action;
  const checkout = 'https://somamentoria.com/checkout?' + params('checkout');
  const start = 'https://somamentoria.com/onboarding?' + params('ativacao');
  const activationFirst = stage === 'd3' && onboarding;
  const primaryUrl = activationFirst ? start : checkout;
  const primaryLabel = activationFirst ? (hasInterview ? 'Ver próximos passos da minha jornada' : 'Fazer minha entrevista inicial') : stage === 'p2' ? 'Conhecer os planos' : 'Escolher como continuar';
  const secondary = activationFirst
    ? '<p>Já sabe que quer continuar? <a href="' + checkout + '">Veja os planos da SOMA</a>.</p>'
    : onboarding && stage === 'd1'
      ? '<p>Antes de escolher, você também pode <a href="' + start + '">' + (hasInterview ? 'rever sua jornada' : 'começar sua entrevista inicial') + '</a>.</p>'
      : '';
  const html = `<div style="font:16px/1.6 Arial,sans-serif;color:#24382d;max-width:580px;margin:auto;padding:24px">
    <h2>Seu próximo passo de carreira</h2>
    <p>Oi, ${first}!</p>
    <p>${intro}</p><p>${activation}</p>
    <p>Na SOMA, você pode desenvolver seu PDI, organizar seus objetivos e acompanhar sua evolução profissional.</p>
    <p><a href="${primaryUrl}" style="background:#276b52;color:white;padding:12px 18px;text-decoration:none;border-radius:8px">${primaryLabel}</a></p>
    ${secondary}
    ${stage === 'p2' ? '' : `<p>Seu acesso gratuito termina em ${date}.</p>`}
    <p>Se precisar de ajuda para começar, responda a este e-mail.</p>
    <p>Um abraço,<br>Jaqueline Amaro<br>Fundadora da SOMA Mentoria</p>
    <p style="font-size:12px;color:#68746a">Você recebeu este e-mail porque iniciou um teste na SOMA. <a href="${optOutUrl}">Cancelar comunicações comerciais</a>.</p>
  </div>`;
  return { subject: subjects[stage], html };
}
export async function executarTrialGrowth({ expiredOnly = false }: { expiredOnly?: boolean } = {}) {
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
    .eq('is_admin', false).in('trial_status', ['active', 'expired']).not('trial_ends_at', 'is', null);
  if (error) { summary.errors.push('Não foi possível consultar trials.'); return summary; }
  if (!profiles?.length) return summary;
  const { data: interviews, error: interviewError } = await db.from('entrevistas_iniciais')
    .select('user_id').in('user_id', profiles.map(p => p.id));
  if (interviewError) {
    summary.errors.push('Não foi possível verificar a jornada inicial.');
    return summary;
  }
  const interviewed = new Set((interviews || []).map(i => i.user_id));
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
    const stage = trialGrowthStage(profile.trial_status, days);
    if (expiredOnly && stage !== 'p2') continue;
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
    if (freshError || !fresh || !['active', 'expired'].includes(fresh.trial_status)
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
    const msg = buildEmail(firstName, stage, profile.trial_ends_at, !profile.onboarding_concluido, interviewed.has(profile.id), optOutUrl);
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
