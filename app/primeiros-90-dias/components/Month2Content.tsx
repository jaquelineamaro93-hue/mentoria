'use client';

interface Month2ContentProps {
  respostas: Record<string, any>;
  situacao: string;
  onChange: (path: string, value: any) => void;
}

export default function Month2Content({ respostas, onChange }: Month2ContentProps) {
  const earlyWins = respostas['early_wins'] || { win1: '', win2: '' };
  const influenceMatrix = respostas['influence_matrix'] || {};

  const updateEarlyWin = (key: string, value: string) => {
    onChange('early_wins', { ...earlyWins, [key]: value });
  };

  const updateInfluenceContact = (index: number, field: string, value: string) => {
    const contacts = influenceMatrix['contacts'] || Array(5).fill(null).map(() => ({}));
    contacts[index] = { ...contacts[index], [field]: value };
    onChange('influence_matrix', { ...influenceMatrix, contacts });
  };

  const contacts = influenceMatrix['contacts'] || Array(5).fill(null).map(() => ({}));

  return (
    <div className="space-y-12">
      {/* Early Wins Planner */}
      <section>
        <h3 className="text-2xl text-black font-medium mb-2">Planejador de Vitórias Rápidas</h3>
        <p className="text-gray-text text-sm mb-6 leading-relaxed">
          Defina 2 entregas de alto valor perceptível para os primeiros 60 dias. Estas vitórias
          criarão credibilidade e demonstração de impacto.
        </p>

        <div className="space-y-6">
          {[
            {
              key: 'win1',
              label: 'Vitória Rápida 1',
              placeholder: 'Ex: Resolução de gargalo crítico em X dias',
            },
            {
              key: 'win2',
              label: 'Vitória Rápida 2',
              placeholder: 'Ex: Implementação de processo que economiza Y horas',
            },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-black mb-2">{label}</label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={earlyWins[key] || ''}
                  onChange={(e) => updateEarlyWin(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full p-3 rounded border border-gray-faint bg-white text-sm text-black focus:outline-none focus:ring-2 focus:ring-mint"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Influence Matrix */}
      <section>
        <h3 className="text-2xl text-black font-medium mb-2">Matriz de Influência e Coalizões</h3>
        <p className="text-gray-text text-sm mb-6 leading-relaxed">
          Mapeie 5 contatos estratégicos horizontais (fora da linha direta de comando) e planeje
          como construir relacionamentos de influência.
        </p>

        <div className="space-y-4">
          {Array(5)
            .fill(null)
            .map((_, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border border-gray-faint bg-gray-light space-y-3"
              >
                <div className="flex gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
                    style={{ backgroundColor: '#3DD9C8' }}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      placeholder="Nome / Cargo"
                      value={contacts[idx]?.name || ''}
                      onChange={(e) => updateInfluenceContact(idx, 'name', e.target.value)}
                      className="w-full p-2 rounded border border-mint-border bg-white text-sm text-black focus:outline-none focus:ring-2 focus:ring-mint"
                    />
                    <textarea
                      placeholder="Estratégia de aproximação e oportunidades de colaboração"
                      value={contacts[idx]?.strategy || ''}
                      onChange={(e) => updateInfluenceContact(idx, 'strategy', e.target.value)}
                      className="w-full p-2 rounded border border-mint-border bg-white text-sm text-black resize-none focus:outline-none focus:ring-2 focus:ring-mint"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
