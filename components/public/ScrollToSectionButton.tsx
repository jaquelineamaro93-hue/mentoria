'use client';

import type { ReactNode } from 'react';

export default function ScrollToSectionButton({ targetId, className, children }: {
  targetId: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button type="button" className={className} aria-controls={targetId} onClick={() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'start',
      });
    }}>
      {children}
    </button>
  );
}
