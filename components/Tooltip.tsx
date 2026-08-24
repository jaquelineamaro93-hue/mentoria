import { Info } from 'lucide-react';

interface TooltipProps {
  texto: string;
}

export function Tooltip({ texto }: TooltipProps) {
  return (
    <div className="group relative inline-flex items-center ml-1">
      <Info size={14} className="text-gray-text cursor-help hover:text-black transition-colors" />
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-ink rounded text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 font-medium">
        {texto}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-ink" />
      </div>
    </div>
  );
}
