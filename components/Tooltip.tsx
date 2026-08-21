'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  texto: string;
  children?: React.ReactNode;
}

export function Tooltip({ texto, children }: TooltipProps) {
  const [visivel, setVisivel] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      <span
        onMouseEnter={() => setVisivel(true)}
        onMouseLeave={() => setVisivel(false)}
        className="inline-flex items-center cursor-help text-ink-faint hover:text-brown-deep transition-colors"
      >
        {children ?? <Info size={14} strokeWidth={1.5} />}
      </span>
      {visivel && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 text-xs text-white bg-gray-800 rounded-lg px-3 py-2 shadow-lg pointer-events-none">
          {texto}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </span>
      )}
    </span>
  );
}
