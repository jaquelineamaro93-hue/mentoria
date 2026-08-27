'use client';

import posthog from 'posthog-js';

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === 'undefined') return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!key || !host) return;

  try {
    posthog.init(key, {
      api_host: host,
      person_profiles: 'identified_only',
      defaults: '2026-05-30',
      capture_pageview: true,
      capture_pageleave: true,
      capture_performance: true,
    });
    initialized = true;
  } catch (error) {
    // Silently fail if PostHog initialization fails (invalid key, network error, etc)
    console.debug('PostHog initialization failed - telemetry disabled');
  }
}

// Liga os eventos futuros a uma pessoa real (chame logo após login/cadastro).
export function identificarMentorado(userId: string, props?: Record<string, unknown>) {
  posthog.identify(userId, props);
}

export function limparIdentidade() {
  posthog.reset();
}

export { posthog };
