'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Script from 'next/script';

export default function CheckoutPage() {
  const supabase = createClient();
  const [isGuest, setIsGuest] = useState(false);
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsGuest(true);
      } else {
        setEmail(session.user.email || '');
      }
    };

    checkSession();
  }, [supabase]);

  const handleCheckout = async () => {
    if (!email) {
      alert('Email é obrigatório!');
      return;
    }

    setIsProcessing(true);

    try {
      // Cria preferência de pagamento com email (payer.email)
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          external_reference: `guest_${Date.now()}`,
          items: [
            {
              id: 'mentoria-soma',
              title: 'SOMA Mentoria - Acesso Completo',
              description: 'Programa de mentoria com acesso a todos os recursos',
              quantity: 1,
              currency_id: 'BRL',
              unit_price: 99.90,
            }
          ],
          payer: {
            email: email,
          },
          notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/mercadopago`,
          binary_mode: true,
          statement_descriptor: 'SOMA MENTORIA',
        }),
      });

      const { init_point } = await response.json();
      
      // Redireciona pro MercadoPago
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
      {/* SDK MercadoPago.JS V2 */}
      <Script 
        src="https://sdk.mercadopago.com/js/v2" 
        strategy="afterInteractive"
      />

      <div className="min-h-screen bg-cream p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-display text-brown-deep mb-8">Checkout</h1>
          
          <div className="bg-white border-2 border-line rounded-2xl p-8">
            <div className="mb-6">
              <label className="block text-sm font-medium text-brown-deep mb-2">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-brown-deep"
                required
              />
            </div>

            <div className="bg-gray-50 p-6 rounded mb-6">
              <h3 className="font-medium text-brown-deep mb-2">SOMA Mentoria</h3>
              <p className="text-sm text-ink-faint mb-4">Acesso completo ao programa</p>
              <p className="text-2xl font-bold text-brown-deep">R$ 99,90</p>
            </div>

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
