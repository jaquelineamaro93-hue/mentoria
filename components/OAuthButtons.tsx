'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: CredentialResponse) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: { theme: string; size: string; text: string }
          ) => void;
        };
      };
    };
  }
}

interface CredentialResponse {
  credential: string;
}

export default function OAuthButtons() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!window.google) {
      console.log('Google SDK not loaded yet');
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Google Client ID não configurado');
      return;
    }

    const handleGoogleResponse = async (response: CredentialResponse) => {
      setLoading(true);
      setError(null);

      try {
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );

        const decodedToken = JSON.parse(jsonPayload);

        const res = await fetch('/api/auth/oauth/google/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: response.credential,
            user: {
              id: decodedToken.sub,
              email: decodedToken.email,
              name: decodedToken.name,
              picture: decodedToken.picture,
            },
          }),
        });

        const data = await res.json();

        if (data.loginUrl) {
          window.location.href = data.loginUrl;
        } else if (data.error) {
          setError(data.error);
        } else {
          setError('Erro ao fazer login com Google');
        }
      } catch (err) {
        console.error('Erro ao processar login com Google:', err);
        setError('Erro ao processar login com Google');
      } finally {
        setLoading(false);
      }
    };

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleResponse,
    });

    const googleButton = document.getElementById('google-signin-button');
    if (googleButton) {
      window.google.accounts.id.renderButton(googleButton, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
      });
    }
  }, []);

  return (
    <div className="space-y-3 my-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <div id="google-signin-button" className="flex justify-center" />

      <div className="text-center text-sm text-gray-500">
        ou use email e senha acima
      </div>
    </div>
  );
}
