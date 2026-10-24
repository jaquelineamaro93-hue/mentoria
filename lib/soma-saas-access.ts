/**
 * Pure, fail-closed SaaS access rules. This does not grant access on its own:
 * API handlers and RLS must enforce the decision server-side.
 * Keep SaaS subscriptions separate from profiles.status_assinatura
 * (which currently drives human mentorship access).
 */
export const SOMA_SAAS_TRIAL_DAYS = 7 as const;
export type SomaSaasProduct = 'avulso' | 'essencial' | 'pro';
export type SomaSaasStatus = 'trial' | 'active' | 'past_due' | 'paused' | 'cancelled' | 'expired';
export type SomaSaasFeature =
  | 'mapa-quem-sou'
  | 'diagnostico'
  | 'pdi'
  | 'curriculo'
  | 'linkedin'
  | 'vagas'
  | 'entrevistas'
  | 'networking'
  | 'iris'
  | 'whatsapp';

export type SomaSaasEntitlement = {
  product: SomaSaasProduct;
  status: SomaSaasStatus;
  moduleSlug?: string | null;
  trialEndsAt?: string | null;
  paidThrough?: string | null;
  addons?: readonly ('iris' | 'whatsapp')[];
};

const ESSENCIAL: readonly SomaSaasFeature[] = ['mapa-quem-sou', 'diagnostico', 'pdi'];
const PRO: readonly SomaSaasFeature[] = [
  ...ESSENCIAL, 'curriculo', 'linkedin', 'vagas', 'entrevistas', 'networking',
];

export function somaSaasTrialEndsAt(startedAt: Date): Date {
  if (!Number.isFinite(startedAt.getTime())) throw new Error('Invalid trial start');
  return new Date(startedAt.getTime() + SOMA_SAAS_TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

export function canAccessSomaSaasFeature(
  entitlement: SomaSaasEntitlement | null | undefined,
  feature: SomaSaasFeature,
  now: Date = new Date(),
): boolean {
  if (!entitlement || !Number.isFinite(now.getTime())) return false;
  if (entitlement.status === 'trial') {
    if (!entitlement.trialEndsAt) return false;
    const until = Date.parse(entitlement.trialEndsAt);
    if (!Number.isFinite(until) || now.getTime() >= until) return false;
  } else if (entitlement.status === 'active') {
    if (!entitlement.paidThrough) return false;
    const until = Date.parse(entitlement.paidThrough);
    if (!Number.isFinite(until) || now.getTime() >= until) return false;
  } else {
    return false;
  }

  if (feature === 'iris' || feature === 'whatsapp') {
    return entitlement.addons?.includes(feature) ?? false;
  }

  if (entitlement.product === 'pro') return PRO.includes(feature);
  if (entitlement.product === 'essencial') return ESSENCIAL.includes(feature);
  if (entitlement.product === 'avulso') return entitlement.moduleSlug === feature;
  return false;
}
