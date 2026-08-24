'use client';

import Link from 'next/link';

const PLANOS = [
  {
    id: 'soma-6m',
    title: 'SOMA 6 meses',
    subtitle: 'Movimento e Posicionamento',
    duracao: '6 MESES',
    encontros: '13 encontros: 1 online individual, 6 online coletivos, 6 presenciais coletivos',
    features: [
      'Diagnóstico de Perfil e Carreira',
      'Mapeamento de Talentos',
      'Plano de Ação 90 dias',
      'Presença Profissional (revisão de LinkedIn ou Currículo)',
      'Bônus: Guia Dream Board',
    ],
    precos: {
      vista: 650,
      cartao: 700,
      recorrente: '6x R$ 125,00/mês',
    },
  },
  {
    id: 'soma-12m',
    title: 'SOMA 12 meses',
    subtitle: 'Consistência e Alta Performance',
    duracao: '12 MESES',
    encontros: '14 encontros: 2 online individuais, 12 online coletivos, 12 presenciais coletivos',
    features: [
      'Diagnóstico de Perfil e Carreira',
      'Mapeamento de Talentos',
      'Plano de Ação 90 dias',
      'Presença Profissional (revisão de LinkedIn ou Currículo)',
      'Bônus: Guia Dream Board',
    ],
    precos: {
      vista: 850,
      cartao: 950,
      recorrente: '12x R$ 100,00/mês',
    },
  },
];

export default function PlanosPage() {
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-display text-black mb-12 text-center">Nossos Planos</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {PLANOS.map((plano) => (
            <div key={plano.id} className="bg-white border-2 border-gray-faint rounded-2xl p-8 flex flex-col">
              <div className="mb-6">
                <p className="text-xs font-medium text-blue-600 mb-2">{plano.duracao}</p>
                <h2 className="text-2xl font-display text-black mb-1">{plano.title}</h2>
                <p className="text-sm text-gray-text mb-4">{plano.subtitle}</p>
                <p className="text-xs text-gray-text mb-6">{plano.encontros}</p>
              </div>

              <div className="space-y-2 mb-8 flex-grow">
                {plano.features.map((feature, i) => (
                  <div key={i} className="flex gap-2 text-sm text-black">
                    <span>✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-faint pt-6 mb-6">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-text">À vista</span>
                    <span className="font-bold text-black">R$ {plano.precos.vista.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-text">Cartão (1x)</span>
                    <span className="font-bold text-black">R$ {plano.precos.cartao.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-text">Recorrente</span>
                    <span className="font-bold text-black">{plano.precos.recorrente}</span>
                  </div>
                </div>
              </div>

              <Link
                href={`/checkout?plan=${plano.id}`}
                className="w-full bg-brown-deep text-white py-3 rounded-lg font-medium hover:bg-brown text-center transition"
              >
                Comprar
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
