'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function OAuthButtons({ trialPlanId }: { trialPlanId?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loginWithGoogle() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const destination = new URL('/auth/confirm', window.location.origin);
      if (trialPlanId) destination.searchParams.set('trial_plan', trialPlanId);
      const callback = new URL('/auth/callback', window.location.origin);
      callback.searchParams.set('next', destination.pathname + destination.search);
      const { error: authError } = await createClient().auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callback.toString(),
          queryParams: { prompt: 'select_account' },
        },
      });
      if (authError) throw authError;
    } catch {
      setError('Não foi possível abrir o login com Google. Tente novamente ou entre com seu e-mail.');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 my-6">
      {error && <p role="alert" className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</p>}
      <button type="button" onClick={loginWithGoogle} disabled={loading} aria-busy={loading}
        className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-deep disabled:opacity-60">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.4Z"/><path fill="#34A853" d="M12 22c2.7 0 5-0.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H3.1v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6Z"/><path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.5 9.5 0 0 0 12 2a10 10 0 0 0-8.9 5.5l3.3 2.6A5.9 5.9 0 0 1 12 5.9Z"/></svg>
        {loading ? 'Abrindo Google…' : 'Continuar com Google'}
      </button>
      <p className="text-center text-sm text-gray-600">Você será direcionada ao Google e voltará ao SOMA.</p>
    </div>
  );
}
