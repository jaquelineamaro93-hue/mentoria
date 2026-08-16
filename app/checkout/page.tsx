'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Script from 'next/script';

const PLANOS = {
  'soma-6m': {
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
      recorrente: { valor: 125, vezes: 6, periodo: 'mês' },
    },
  },
  'soma-12m': {
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
      recorrente: { valor: 100, vezes: 12, periodo: 'mês' },
    },
  },
  'teste': {
    title: 'SOMA Teste',
    subtitle: 'Plano de teste (OCULTAR DEPOIS)',
    duracao: 'TESTE',
    encontros: 'Acesso completo para teste',
    features: ['Teste de pagamento', 'Webhook', 'Criação de conta'],
    precos: {
      vista: 1,
      cartao: 1,
      recorrente: { valor: 0.01, vezes: 1, periodo: 'mês' },
    },
  },
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const planId = (searchParams.get('plan') || 'soma-6m') as keyof typeof PLANOS;
  const plan = PLANOS[planId] || PLANOS['soma-6m'];

  const [email, setEmail] = useState('');
  const [paymentType, setPaymentType] = useState<'vista' | 'cartao' | 'recorrente'>('vista');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setEmail(session.user.email || '');
      }
    };
    checkSession();
  }, [supabase]);

  const getPrice = () => {
    if (paymentType === 'vista') return plan.precos.vista;
    if (paymentType === 'cartao') return plan.precos.cartao;
    return plan.precos.recorrente.valor;
  };

  const handleCheckout = async () => {
    if (!email) {
      alert('Email é obrigatório!');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          external_reference: `${planId}_${Date.now()}`,
          plan_id: planId,
          payment_type: paymentType,
          items: [
            {
              id: planId,
              title: plan.title,
              description: plan.subtitle,
              quantity: 1,
              currency_id: 'BRL',
              unit_price: getPrice(),
            }
          ],
          payer: { email },
          notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/mercadopago`,
          binary_mode: true,
          statement_descriptor: 'SOMA MENTORIA',
        }),
      });

      const { init_point } = await response.json();
      if (init_point) {
        window.location.href = init_point;
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao iniciar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Script src="https://sdk.mercadopago.com/js/v2" strategy="afterInteractive" />

      <div className="min-h-screen bg-cream p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-display text-brown-deep mb-2">{plan.title}</h1>
          <p className="text-sm text-ink-faint mb-8">{plan.subtitle}</p>

          <div className="bg-white border-2 border-line rounded-2xl p-8">
            {/* Detalhes do plano */}
            <div className="mb-8">
              <p className="text-xs font-medium text-blue-600 mb-2">{plan.duracao}</p>
              <p className="text-sm text-ink-faint mb-4">{plan.encontros}</p>
              
              <div className="space-y-2 mb-6">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex gap-2 text-sm text-ink">
                    <span>✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Email */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-brown-deep mb-2">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-brown-deep"
              />
            </div>

            {/* Opções de pagamento */}
            <div className="space-y-3 mb-8">
              <button
                onClick={() => setPaymentType('vista')}
                className={`w-full p-4 rounded-lg border-2 text-left transition ${
                  paymentType === 'vista'
                    ? 'border-brown-deep bg-brown-deep text-white'
                    : 'border-line hover:border-brown-deep'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">À vista</span>
                  <span className="font-bold">R$ {plan.precos.vista.toFixed(2)}</span>
                </div>
              </button>

              <button
                onClick={() => setPaymentType('cartao')}
                className={`w-full p-4 rounded-lg border-2 text-left transition ${
                  paymentType === 'cartao'
                    ? 'border-brown-deep bg-brown-deep text-white'
                    : 'border-line hover:border-brown-deep'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">Cartão (1x)</span>
                  <span className="font-bold">R$ {plan.precos.cartao.toFixed(2)}</span>
                </div>
              </button>

              <button
                onClick={() => setPaymentType('recorrente')}
                className={`w-full p-4 rounded-lg border-2 text-left transition ${
                  paymentType === 'recorrente'
                    ? 'border-brown-deep bg-brown-deep text-white'
                    : 'border-line hover:border-brown-deep'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    Recorrente ({plan.precos.recorrente.vezes}x)
                  </span>
                  <span className="font-bold">
                    R$ {plan.precos.recorrente.valor.toFixed(2)}/{plan.precos.recorrente.periodo}
                  </span>
                </div>
              </button>
            </div>

            {/* Botão de pagamento */}
            <button
              onClick={handleCheckout}
              disabled={isProcessing || !email}
              className="w-full bg-brown-deep text-white py-3 rounded-lg font-medium hover:bg-brown disabled:opacity-50"
            >
              {isProcessing ? 'Processando...' : 'Pagar com MercadoPago'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
