'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google?: {
      accounts: { id: {
        initialize: (config: {
          client_id: string;
          callback: (response: { credential: string }) => void;
          use_fedcm_for_button: boolean;
          button_auto_select: boolean;
        }) => void;
        renderButton: (element: HTMLElement, options: { theme: string; size: string; text: string }) => void;
      } };
    };
  }
}

export default function OAuthButtons({ trialPlanId }: { trialPlanId?: string | null }) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const pending = useRef(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const google = window.google;
    const button = buttonRef.current;
    if (!ready || !google || !button || !clientId) return;

    google.accounts.id.initialize({
      client_id: clientId,
      // Usa a seleção de conta do navegador em vez da janela legada gsi/transform.
      use_fedcm_for_button: true,
      button_auto_select: false,
      callback: async ({ credential }) => {
        if (pending.current) return;
        pending.current = true;
        setLoading(true);
        setError(null);
        try {
          const response = await fetch('/api/auth/oauth/google/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: credential, trialPlanId: trialPlanId || null }),
          });
          const result = await response.json();
          if (!response.ok || !result.loginUrl) throw new Error(result.error || 'Não foi possível concluir o login com Google.');
          window.location.assign(result.loginUrl);
        } catch (failure) {
          setError(failure instanceof Error ? failure.message : 'Não foi possível entrar. Tente novamente ou use seu e-mail.');
          pending.current = false;
          setLoading(false);
        }
      },
    });
    button.replaceChildren();
    google.accounts.id.renderButton(button, { theme: 'outline', size: 'large', text: 'signin_with' });
    return () => { button.replaceChildren(); };
  }, [ready, clientId, trialPlanId]);

  return (
    <div className="space-y-3 my-6">
      <Script id="google-identity" src="https://accounts.google.com/gsi/client" strategy="afterInteractive"
        onReady={() => setReady(true)}
        onError={() => setError('Não foi possível carregar o Google. Atualize a página ou entre com seu e-mail.')} />
      {(error || !clientId) && <p role="alert" className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error || 'Login com Google indisponível. Entre com seu e-mail.'}</p>}
      {!ready && !error && clientId && <p role="status" className="text-center text-sm text-gray-600">Carregando login com Google…</p>}
      <div ref={buttonRef} className={`flex justify-center ${loading ? 'pointer-events-none opacity-60' : ''}`} aria-busy={loading} />
      {loading && <p role="status" className="text-center text-sm text-gray-600">Confirmando seu acesso ao SOMA…</p>}
      <p className="text-center text-sm text-gray-600">Ou entre com seu e-mail acima.</p>
    </div>
  );
}
