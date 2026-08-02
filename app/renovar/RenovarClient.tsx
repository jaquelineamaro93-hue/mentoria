'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { posthog, limparIdentidade } from '@/lib/posthog';
import type { Profile } from '@/lib/types';

interface Props {
  profile: Profile | null;
}

export default function RenovarClient({ profile }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    limparIdentidade();
    router.push('/login');
    router.refresh();
  }

  async function assinar() {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch('/api/mercadopago/criar-assinatura', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      posthog.capture('assinatura_iniciada');
      window.location.href = data.init_point;
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Não foi possível iniciar a assinatura agora. Entre em contato com a Jaque.'
      );
    }
    setCarregando(false);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md text-center">
        <div className="w-14 h-14 rounded-full bg-sky-tint border border-sky flex items-center justify-center mx-auto mb-6">
          <Lock size={22} className="text-sky-deep" />
        </div>

        <p className="font-display text-3xl text-brown-deep mb-2">
          Sua assinatura precisa ser renovada
        </p>
        <p className="text-sm text-ink-faint mb-8">
          Olá, {profile?.nome?.split(' ')[0] ?? 'mentorada'}. Seu acesso ao Portal da
          Mentoria SOMA está pausado. Renove abaixo para continuar sua jornada.
        </p>

        {erro && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-300 rounded-md px-4 py-3 mb-6 text-left">
            {erro}
          </p>
        )}

        <button
          onClick={assinar}
          disabled={carregando}
          className="w-full flex items-center justify-center gap-2 bg-brown hover:bg-brown-deep disabled:opacity-60 text-paper text-sm font-medium px-6 py-3.5 rounded-full transition-colors mb-4"
        >
          {carregando ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ExternalLink size={16} />
          )}
          {carregando ? 'Abrindo pagamento...' : 'Renovar assinatura'}
        </button>

        <p className="text-xs text-ink-faint mb-8">
          Você vai ser levada ao Mercado Pago para concluir o pagamento.
        </p>

        <button
          onClick={handleSignOut}
          className="text-xs text-ink-faint hover:text-brown transition-colors"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
