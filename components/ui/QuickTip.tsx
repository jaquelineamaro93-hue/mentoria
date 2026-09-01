'use client';

import { usePathname } from 'next/navigation';
import { Lightbulb } from 'lucide-react';
import { getQuickTipForPath } from '@/lib/config/tipsConfig';

export function QuickTip() {
  const pathname = usePathname();
  const tip = getQuickTipForPath(pathname);

  // Se a página não tiver dica cadastrada ou for dashboard, não renderiza nada
  if (!tip || pathname === '/dashboard') return null;

  return (
    <div className="bg-gray-light border border-gray-faint rounded-lg p-4 text-sm transition-all">
      <div className="flex items-start gap-3">
        <Lightbulb size={16} className="text-gray-text mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-black mb-1">{tip.title}</p>
          {tip.description && (
            <p className="text-gray-text text-xs leading-relaxed">{tip.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
