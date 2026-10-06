'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock3, Sparkles } from 'lucide-react';
import { getProductSessionId } from '@/lib/product-analytics';

type TrialState = {
  status: 'active' | 'expired';
  planId?: string;
  planName?: string;
  trialDays?: number;
  startedAt?: string;
  endsAt?: string;
  elapsedDays?: number;
  daysLeft?: number;
  distinctCoreFeatures?: number;
  variant?: string;
  shouldPrompt?: boolean;
  promptedAt?: string | null;
};

export default function TrialBanner({ pathname }: { pathname: string }) {
  const [state, setState] = useState<TrialState | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function carregar() {
      try {
        const response = await fetch('/api/trial/state', {
          cache: 'no-store',
          credentials: 'same-origin',
        });

        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) setState(data.state ?? null);
      } catch {
        // Trial nunca deve impedir o uso do portal.
      }
    }

    void carregar();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (!state?.shouldPrompt || !state.startedAt || state.status !== 'active') return;

    void fetch('/api/product-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        eventName: 'trial_prompt_view',
        featureKey: 'trial',
        path: pathname,
        sessionId: getProductSessionId(),
        metadata: {
          variant: state.variant,
          trial_day: state.elapsedDays,
          core_features: state.distinctCoreFeatures,
          plan_id: state.planId,
        },
        dedupeKey: `trial_prompt_view:${state.startedAt}`,
      }),
    }).catch(() => {});
  }, [
    pathname,
    state?.shouldPrompt,
    state?.startedAt,
    state?.status,
    state?.variant,
    state?.elapsedDays,
    state?.distinctCoreFeatures,
    state?.planId,
  ]);

  if (!state || state.status !== 'active' || !state.planId) return null;

  const dias = state.daysLeft ?? 0;
  const urgente = dias <= 2;

  async function registrarClique() {
    await fetch('/api/product-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      keepalive: true,
      body: JSON.stringify({
        eventName: 'trial_upgrade_click',
        featureKey: 'trial',
        path: pathname,
        sessionId: getProductSessionId(),
        metadata: {
          variant: state?.variant,
          trial_day: state?.elapsedDays,
          days_left: dias,
          plan_id: state?.planId,
        },
      }),
    }).catch(() => {});
  }

  if (!state.shouldPrompt) {
    return (
      <div className="mb-5 flex flex-col gap-2 rounded-xl border border-mint/70 bg-mint-light/35 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <Clock3 size={16} className="shrink-0 text-mint-deep" />
          <p className="text-xs leading-5 text-black">
            <strong>Teste gratuito:</strong> {dias} {dias === 1 ? 'dia restante' : 'dias restantes'}.
            Explore o portal no seu ritmo.
          </p>
        </div>
        <Link
          href={`/checkout?plan=${state.planId}`}
          onClick={() => void registrarClique()}
          className="shrink-0 text-xs font-medium text-mint-deep hover:underline"
        >
          Ver plano
        </Link>
      </div>
    );
  }

  return (
    <div
      className={[
        'mb-6 rounded-2xl border p-4 md:p-5',
        urgente ? 'border-amber-300 bg-amber-50' : 'border-mint bg-mint-light/45',
      ].join(' ')}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-mint-deep">
            <Sparkles size={14} className="shrink-0" />
            Seu teste gratuito
          </p>
          <p className="mt-1 text-sm font-medium text-black">
            Você já começou a usar a SOMA. Quer continuar sua jornada depois do trial?
          </p>
          <p className="mt-1 text-xs leading-5 text-gray-text">
            {dias} {dias === 1 ? 'dia restante' : 'dias restantes'}
            {state.distinctCoreFeatures
              ? ` · ${state.distinctCoreFeatures} áreas principais já exploradas`
              : ''}
            . Você continua com acesso até o fim do período, mesmo se decidir depois.
          </p>
        </div>

        <Link
          href={`/checkout?plan=${state.planId}`}
          onClick={() => void registrarClique()}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brown-deep px-4 py-2.5 text-sm font-medium text-white hover:bg-brown"
        >
          Continuar com a SOMA
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
