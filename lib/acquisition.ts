'use client';
import { posthog } from '@/lib/posthog';
const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
export function captureAcquisition() {
  if (typeof window === 'undefined') return;
  const query = new URLSearchParams(window.location.search);
  const attribution: Record<string, string> = {};
  for (const key of keys) {
    const value = query.get(key);
    // Campaign identifiers only. Never forward arbitrary query strings or contact data.
    if (value && /^[a-zA-Z0-9_-]{1,100}$/.test(value)) attribution[key] = value;
  }
  if (Object.keys(attribution).length) {
    posthog.register(attribution);
    posthog.register_once(Object.fromEntries(Object.entries(attribution).map(([key,value]) => ['first_' + key,value])));
  }
}
export function acquisitionEvent(event: string, properties: Record<string, string> = {}) {
  captureAcquisition();
  posthog.capture(event, properties);
}
