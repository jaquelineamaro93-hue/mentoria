'use client';

const STARS_OPTIONS = [
  {
    id: 'startup',
    label: 'Start-up',
    description: 'Construção e estruturação do zero',
    focus:
      'Foque em estabelecer fundações sólidas, definir processos iniciais e recrutar o primeiro time.',
  },
  {
    id: 'turnaround',
    label: 'Turnaround',
    description: 'Reorganização urgente e gestão de crise',
    focus:
      'Priorize estabilização imediata, comunicação clara e decisões estruturantes rápidas.',
  },
  {
    id: 'realinhamento',
    label: 'Realinhamento',
    description: 'Ajuste de rota em operação existente',
    focus: 'Equilibre continuidade operacional com mudanças estratégicas necessárias.',
  },
  {
    id: 'sustentacao',
    label: 'Sustentação do Sucesso',
    description: 'Manutenção e escala de alta performance',
    focus: 'Otimize processos, desenvolva talentos e prepare o próximo ciclo de crescimento.',
  },
];

interface StarsSelectorProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

export default function StarsSelector({ selected, onSelect }: StarsSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {STARS_OPTIONS.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={`p-6 rounded-lg border-2 transition-all text-left ${
            selected === option.id
              ? 'border-mint bg-mint-light'
              : 'border-gray-faint hover:border-mint bg-white'
          }`}
        >
          <h3 className="font-medium text-black text-lg mb-2">{option.label}</h3>
          <p className="text-gray-text text-sm mb-4">{option.description}</p>
          <div className="p-3 rounded bg-white border border-mint-border">
            <p className="text-xs text-gray-text leading-relaxed">
              <span className="font-medium text-black">Foco:</span> {option.focus}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
