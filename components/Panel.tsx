import type { ReactNode } from 'react';

export function Panel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-gray-faint bg-white ${className}`}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.18em] text-mint mb-3 flex items-center gap-2 bg-mint/10 px-3 py-1.5 rounded-md inline-flex w-fit border border-mint/20">
      {children}
    </p>
  );
}
