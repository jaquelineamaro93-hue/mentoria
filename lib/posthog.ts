'use client';

import posthog from 'posthog-js';

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === 'undefined') return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!key || !host) return;

  posthog.init(key, {
    api_host: host,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
  });

  initialized = true;
}

// Liga os eventos futuros a uma pessoa real (chame logo após login/cadastro).
export function identificarMentorado(userId: string, props?: Record<string, unknown>) {
  posthog.identify(userId, props);
}

export function limparIdentidade() {
  posthog.reset();
}

export { posthog };
