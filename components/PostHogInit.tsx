'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { captureAcquisition } from '@/lib/acquisition';
import { initPostHog } from '@/lib/posthog';

export default function PostHogInit() {
  const pathname = usePathname();
  useEffect(() => {
    initPostHog();
    captureAcquisition();
  }, [pathname]);

  return null;
}
