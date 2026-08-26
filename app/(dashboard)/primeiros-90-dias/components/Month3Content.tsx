'use client';

interface Month3ContentProps {
  respostas: Record<string, any>;
  situacao: string;
  onChange: (path: string, value: any) => void;
}

const PILLARS = [
  { key: 'estrategia', label: 'Estratégia' },
  { key: 'estrutura', label: 'Estrutura' },
  { key: 'processos', label: 'Processos' },
  { key: 'capacidades', label: 'Capacidades do Time' },
  { key: 'cultura', label: 'Cultura' },
];

export default function Month3Content({ respostas, onChange }: Month3ContentProps) {
  const arquitetura = respostas['arquitetura_avaliacao'] || {};
  const sintese = respostas['sintese_mentoria'] || '';

  const updatePillar = (key: string, value: string) => {
    onChange('arquitetura_avaliacao', { ...arquitetura, [key]: value });
  };

  const updateSintese = (value: string) => {
    onChange('sintese_mentoria', value);
  };

  return (
    <div className="space-y-12">
      {/* Organizational Architecture Evaluation */}
      <section>
        <h3 className="text-2xl text-black font-medium mb-2">Avaliação de Arquitetura Organizacional</h3>
        <p className="text-gray-text text-sm mb-6 leading-relaxed">
          Faça uma análise rápida dos 5 pilares fundamentais. Identifique pontos fortes e áreas
          de melhoria para sustentar o crescimento.
        </p>

        <div className="space-y-6">
          {PILLARS.map((pillar) => (
            <div key={pillar.key} className="p-6 rounded-lg border border-gray-faint bg-gray-light">
              <label className="block text-sm font-medium text-black mb-3">{pillar.label}</label>
              <textarea
                value={arquitetura[pillar.key] || ''}
                onChange={(e) => updatePillar(pillar.key, e.target.value)}
                placeholder={`Análise rápida: está claro? É eficiente? Precisa de ajustes?`}
                className="w-full p-3 rounded border border-mint-border bg-white text-sm text-black resize-none focus:outline-none focus:ring-2 focus:ring-mint"
                rows={3}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Synthesis for Mentor */}
      <section>
        <h3 className="text-2xl text-black font-medium mb-2">Síntese para o Mentor SOMA</h3>
        <p className="text-gray-text text-sm mb-6 leading-relaxed">
          Resuma os pontos trabalhados nos 90 dias. Isto servirá como base para a sessão
          individual de acompanhamento e planejamento do próximo ciclo.
        </p>

        <textarea
          value={sintese}
          onChange={(e) => updateSintese(e.target.value)}
          placeholder="Descreva: O que aprendeu? Quais foram os maiores desafios? Qual é o próximo passo estratégico? Como está sua autoconfiança neste novo papel?"
          className="w-full p-4 rounded border border-gray-faint bg-white text-sm text-black resize-none focus:outline-none focus:ring-2 focus:ring-mint"
          rows={8}
        />

        <div className="mt-4 p-4 rounded-lg bg-mint-light border border-mint-border">
          <p className="text-xs text-gray-text leading-relaxed">
            Dica: Faça perguntas provocadoras a si mesmo. Qual foi meu maior aprendizado? O que
            eu gostaria de ter feito diferente? Quem foram meus aliados críticos? Como isso muda
            meu plano para os próximos 12 meses?
          </p>
        </div>
      </section>
    </div>
  );
}
