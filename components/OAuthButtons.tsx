'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface GoogleAuthResponse {
  credential: string;
}

interface LinkedInProfile {
  id: string;
  email: string;
  localizedFirstName: string;
  localizedLastName: string;
  profilePicture?: {
    displayImage: string;
  };
}

export default function OAuthButtons() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google OAuth Handler
  const handleGoogleLogin = async (response: GoogleAuthResponse) => {
    setLoading(true);
    setError(null);

    try {
      // Decodificar JWT do Google
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const googleUser = JSON.parse(jsonPayload);

      // Enviar para callback
      const res = await fetch('/api/auth/oauth/google/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: response.credential,
          user: {
            id: googleUser.sub,
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture,
          },
        }),
      });

      const data = await res.json();

      if (data.loginUrl) {
        window.location.href = data.loginUrl;
      } else {
        setError('Erro ao fazer login com Google');
      }
    } catch (err) {
      setError('Erro ao processar login com Google');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // LinkedIn OAuth Handler
  const handleLinkedInLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simular login com LinkedIn (em produção, usar SDK do LinkedIn)
      const linkedinToken = localStorage.getItem('linkedin_token');

      if (!linkedinToken) {
        setError('Token do LinkedIn não encontrado. Faça login no LinkedIn primeiro.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth/oauth/linkedin/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: linkedinToken,
          user: {
            id: localStorage.getItem('linkedin_id') || '',
            email: localStorage.getItem('linkedin_email') || '',
            name: localStorage.getItem('linkedin_name') || '',
            picture: localStorage.getItem('linkedin_picture'),
          },
        }),
      });

      const data = await res.json();

      if (data.loginUrl) {
        window.location.href = data.loginUrl;
      } else {
        setError('Erro ao fazer login com LinkedIn');
      }
    } catch (err) {
      setError('Erro ao processar login com LinkedIn');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 my-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full py-2 px-4 bg-white border border-gray-300 rounded text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2 transition"
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continuar com Google
      </button>

      <button
        onClick={handleLinkedInLogin}
        disabled={loading}
        className="w-full py-2 px-4 bg-[#0A66C2] text-white rounded font-medium hover:bg-[#084A8F] disabled:opacity-50 flex items-center justify-center gap-2 transition"
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.731-2.004 1.438-.103.25-.129.599-.129.948v5.419h-3.554s.05-8.736 0-9.646h3.554v1.364c.429-.647 1.175-1.569 2.85-1.569 2.08 0 3.637 1.36 3.637 4.286v5.565zM5.337 9.433c-1.144 0-1.915-.758-1.915-1.708 0-.952.77-1.708 1.963-1.708 1.19 0 1.924.756 1.955 1.708 0 .95-.765 1.708-1.963 1.708zm1.946 11.019H3.39V9.788h3.893v10.664zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
        Continuar com LinkedIn
      </button>

      <div className="text-center text-sm text-gray-500">
        ou use email e senha acima
      </div>
    </div>
  );
}
