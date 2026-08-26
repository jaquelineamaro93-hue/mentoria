import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'mint' | 'coral' | 'brown' | 'gray';
}

export function Badge({ children, variant = 'mint' }: BadgeProps) {
  const variantClasses = {
    mint: 'text-mint bg-mint/10 border-mint/20',
    coral: 'text-lotus-coral bg-lotus-coral/10 border-lotus-coral/20',
    brown: 'text-lotus-brown bg-lotus-brown/10 border-lotus-brown/20',
    gray: 'text-gray-text bg-gray-100 border-gray-200',
  };

  return (
    <span className={`text-xs uppercase tracking-wide px-3 py-1.5 rounded-md inline-flex items-center gap-2 w-fit border ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
